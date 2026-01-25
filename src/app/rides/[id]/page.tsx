import { notFound } from 'next/navigation';

interface RidePageProps {
  params: Promise<{ id: string }>;
}

export default async function RidePage({ params }: RidePageProps) {
  const { id } = await params;

  // TODO: Fetch ride data from database
  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Ride Details</h1>
      <p className="text-gray-600">Ride ID: {id}</p>
      <p className="text-gray-500 mt-4">Ride details will be displayed here.</p>
    </div>
  );
}
