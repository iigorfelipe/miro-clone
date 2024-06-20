import Canvas from "./_components/canvas";

interface BoardIdPageProps {
  params: {
    boardId: string;
  };
};

const BoardPage = ({ params }: BoardIdPageProps) => {
  return (
    <Canvas boardId={params.boardId} />
  );
};

export default BoardPage;
