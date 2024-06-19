"use client";

import EmptySearch from "./empty-search";
import EmptyBoards from "./empty-boards";
import EmptyFavorites from "./empty-favorites";

interface BoardLisrProps {
  orgId: string;
  query: {
    search?: string;
    favorites?: string;
  };
};

const BoardList = ({ orgId, query }: BoardLisrProps) => {
  const data = []; // TODO: Change to API call

  if (!data?.length && query.search) {
    return <EmptySearch />
  };

  if (!data?.length && query.favorites) {
    return <EmptyFavorites />
  };

  if (!data?.length) {
    return <EmptyBoards />
  };

  return (
    <div>{JSON.stringify(query)}</div>
  );
};

export default BoardList;
