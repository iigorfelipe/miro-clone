"use client";

import { connectionIdToColor, pointerEventToCanvasPoint, resizeBounds } from "@/lib/utils";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useOthersMapped,
  useStorage
} from "@/liveblocks.config";
import { Camera, CanvasMode, CanvasState, Color, LayerType, Point, Side, XYWH } from "@/types/canvas";
import { LiveObject } from "@liveblocks/client";
import { TextCursor } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CursorPresence } from "./cursors-presence";
import { Info } from "./info";
import { LayerPreview } from "./layer-preview";
import { Participants } from "./participants";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Toolbar } from "./toolbar";

const MAX_LAYERS = 100;

interface CanvasProps {
  boardId: string;
};

const Canvas = ({ boardId }: CanvasProps) => {
  const layerIds = useStorage((root) => root.layerIds);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: CanvasMode.None
  });
  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });
  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0
  });
  const isDragging = useRef(false);
  const lastMousePosition = useRef<Point>({ x: 0, y: 0 });

  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation((
    { storage, setMyPresence },
    layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note,
    position: Point  
  ) => {
    const liveLayers = storage.get("layers");
    if (liveLayers.size >= MAX_LAYERS) {
      return;
    }

    const livelayerIds = storage.get("layerIds");
    const layerId = nanoid();
    const layer = new LiveObject({
      type: layerType,
      x: position.x,
      y: position.y,
      height: 100,
      width: 100,
      fill: lastUsedColor
    });

    livelayerIds.push(layerId);
    liveLayers.set(layerId, layer);

    setMyPresence({ selecion: [layerId] }, { addToHistory: true });
    setCanvasState({ mode: CanvasMode.None });
  }, [lastUsedColor]);

  const translateSelectedLayers = useMutation((
    { storage, self },
    point: Point,
  ) => {

    if (canvasState.mode !== CanvasMode.Translating) {
      return;
    }

    const offset = {
      x: point.x - canvasState.current.x,
      y: point.y - canvasState.current.y,
    };

    const liveLayers = storage.get("layers");

    for (const id of self.presence.selecion) {
      const layer = liveLayers.get(id);

      if (layer) {
        layer.update({
          x: layer.get("x") + offset.x,
          y: layer.get("y") + offset.y,
        })
      }
    }

    setCanvasState({ mode: CanvasMode.Translating, current: point });

  }, [canvasState]);

  const unselectLayers = useMutation((
    { self, setMyPresence }
  ) => {
    if (self.presence.selecion.length > 0) {
      setMyPresence({ selecion: [] }, { addToHistory: true })
    }
  }, [])

  const resizeSelectedLayer = useMutation((
    {  storage, self },
    point: Point
  ) => {
    if (canvasState.mode !== CanvasMode.Resizing) {
      return;
    }

    const bounds = resizeBounds(
      canvasState.initialBounds,
      canvasState.corner,
      point,
    );

    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(self.presence.selecion[0]);

    if (layer) {
      layer.update(bounds);
    };

  }, [canvasState]);

  const onResizeHandlePointerDown = useCallback((
    corner: Side,
    initialBounds: XYWH
  ) => {
    history.pause();
    setCanvasState({
      mode: CanvasMode.Resizing,
      initialBounds,
      corner,
    })
  }, [history]);

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
    e.preventDefault();

    const current = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === CanvasMode.Translating) {
      translateSelectedLayers(current);
    } else if (canvasState.mode === CanvasMode.Resizing) {
      resizeSelectedLayer(current);
    }

    setMyPresence({ cursor: current });

    if (isDragging.current) {
      setCamera((camera) => ({
        x: camera.x + (e.clientX - lastMousePosition.current.x),
        y: camera.y + (e.clientY - lastMousePosition.current.y),
      }));
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [
    camera,
    canvasState,
    resizeSelectedLayer,
    translateSelectedLayers
  ]);

  const onPointerDown = useCallback((
    e: React.PointerEvent,
  ) => {
    const point = pointerEventToCanvasPoint(e, camera);

    if (canvasState.mode === CanvasMode.Inserting) {
      return;
    }

    // TODO: Add case for drawing

    setCanvasState({ origin: point, mode: CanvasMode.Pressing });

    // TODO: onPointerDown2
    if (e.button === 1) {
      isDragging.current = true;
      lastMousePosition.current = { x: e.clientX, y: e.clientY };
    }
  }, [
    camera, canvasState.mode, setCanvasState
  ]);

  const onPointerUp = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
    isDragging.current = false;
    setMyPresence({ cursor: null });

    const point = pointerEventToCanvasPoint(e, camera);
    
    if (canvasState.mode === CanvasMode.None || canvasState.mode === CanvasMode.Pressing) {
      unselectLayers();
      setCanvasState({
        mode: CanvasMode.None
      });
    } else if (canvasState.mode === CanvasMode.Inserting) {
      insertLayer(canvasState.layerType, point);
    } else {
      setCanvasState({
        mode: CanvasMode.None,
      });
    };

    history.resume();
  }, [
    camera,
    canvasState,
    history,
    insertLayer,
    unselectLayers
  ]);

  // const onPointerDown2 = useCallback((e: React.PointerEvent) => {
  //   if (e.button === 1) {
  //     isDragging.current = true;
  //     lastMousePosition.current = { x: e.clientX, y: e.clientY };
  //   }
  // }, []);

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
    isDragging.current = false;
  }, []);

  const onKeyDown = useCallback((e: KeyboardEvent) => {
    const moveStep = 10;
    if (e.key === "ArrowUp") {
      setCamera((camera) => ({ ...camera, y: camera.y - moveStep }));
    } else if (e.key === "ArrowDown") {
      setCamera((camera) => ({ ...camera, y: camera.y + moveStep }));
    } else if (e.key === "ArrowLeft") {
      setCamera((camera) => ({ ...camera, x: camera.x - moveStep }));
    } else if (e.key === "ArrowRight") {
      setCamera((camera) => ({ ...camera, x: camera.x + moveStep }));
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onKeyDown]);


  const selections = useOthersMapped((other) => other.presence.selecion);

  const onLayerPointerDown = useMutation((
    { self, setMyPresence },
    e: React.PointerEvent,
    layerId: string,
  ) => {
    if (
      canvasState.mode === CanvasMode.Pencil ||
      canvasState.mode === CanvasMode.Inserting
    ) {
      return;
    }

    history.pause();
    e.stopPropagation();

    const point = pointerEventToCanvasPoint(e, camera);

    if (!self.presence.selecion.includes(layerId)) {
      setMyPresence({ selecion: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: CanvasMode.Translating, current: point });
    }
  }, [
    setCanvasState,
    camera,
    history,
    canvasState.mode,
  ]);

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelcetion: Record<string, string> = {};

    for (const user of selections) {
      const [connectionId, selection] = user;

      for (const layerId of selection) {
        layerIdsToColorSelcetion[layerId] = connectionIdToColor(connectionId);
      }
    };

    return layerIdsToColorSelcetion;
  }, [selections])

  return (
    <main
      className="h-full w-full relative bg-neutral-100 touch-none"
    >
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        canvasState={canvasState}
        setCanvasState={setCanvasState}
        canRedo={canRedo}
        canUndo={canUndo}
        undo={history.undo}
        redo={history.redo}
      />
      <SelectionTools
        camera={camera}
        setLastUsedColor={setLastUsedColor}
      />
      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
        // onPointerDown={onPointerDown2} // TODO: remove
        onPointerDown={onPointerDown}
      >
        <g
          style={{
            transform: `translate(${camera.x}px, ${camera.y}px)`
          }}
        >
          {
            layerIds.map((layerId) => (
              <LayerPreview
                key={layerId}
                id={layerId}
                onLayerPointerDown={onLayerPointerDown}
                selectionColor={layerIdsToColorSelection[layerId]}
              />
            ))
          }
          <SelectionBox
            onResizeHandlePointerDown={onResizeHandlePointerDown}
          />
          <CursorPresence />
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
