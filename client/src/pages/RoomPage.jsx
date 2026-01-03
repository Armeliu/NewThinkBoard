import { useParams } from 'react-router-dom';

const RoomPage = () => {
  const { code } = useParams();

  return (
    <main className="page">
      <h1>Room {code}</h1>
      <p>Room details will appear here.</p>
    </main>
  );
};

export default RoomPage;
