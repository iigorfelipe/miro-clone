import { useSelf, useMutation } from "@/liveblocks.config";

export const useDeleteLayers = () => {
  const selection = useSelf((me) => me.presence.selecion);

  return useMutation((
    { storage, setMyPresence }
  ) => {

    const liveLayers = storage.get("layers");
    const liveLayerIds = storage.get("layerIds");

    for (const id of selection) {
      liveLayers.delete(id);

      const index = liveLayerIds.indexOf(id);

      if (!index) {
        liveLayerIds.delete(index);
      }
    }

    setMyPresence({ selecion: [] }, { addToHistory: true });
  }, [selection]);
};
