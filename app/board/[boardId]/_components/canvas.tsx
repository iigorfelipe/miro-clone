"use client";

import { pointerEventToCanvasPoint } from "@/lib/utils";
import {
  useCanRedo,
  useCanUndo,
  useHistory,
  useMutation,
  useStorage
} from "@/liveblocks.config";
import { Camera, CanvasMode, CanvasState, Color, LayerType, Point } from "@/types/canvas";
import { LiveObject } from "@liveblocks/client";
import { TextCursor } from "lucide-react";
import { nanoid } from "nanoid";
import { useCallback, useState } from "react";
import { CursorPresence } from "./cursors-presence";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { LayerPreview } from "./layer-preview";

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
  const [isDragging, setIsDragging] = useState(false);
  const [startDragPos, setStartDragPos] = useState<Point>({ x: 0, y: 0 });
  const [startCameraPos, setStartCameraPos] = useState<Camera>({ x: 0, y: 0 });

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

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useMutation(({ setMyPresence }, e: React.PointerEvent) => {
    e.preventDefault();

    const current = pointerEventToCanvasPoint(e, camera);

    setMyPresence({ cursor: current });

    if (isDragging) {
      const deltaX = e.clientX - startDragPos.x;
      const deltaY = e.clientY - startDragPos.y;
      setCamera({
        x: startCameraPos.x + deltaX,
        y: startCameraPos.y + deltaY,
      });
    }
  }, [camera, isDragging, startDragPos, startCameraPos]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    setIsDragging(true);
    setStartDragPos({ x: e.clientX, y: e.clientY });
    setStartCameraPos(camera);
  }, [camera]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    setIsDragging(false);
  }, []);

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
    setIsDragging(false);
  }, []);


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
      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerUp={onPointerUp}
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
                onLayerPointerDown={() => {}}
                selectionColor="#000"
              />
            ))
          }
          <CursorPresence />
        </g>
      </svg>
    </main>
  );
};

export default Canvas;
