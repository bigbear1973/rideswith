import { notFound } from 'next/navigation';

interface OrganizerPageProps {
  params: Promise<{ id: string }>;
}

export default async function OrganizerPage({ params }: OrganizerPageProps) {
  const { id } = await params;

  // TODO: Fetch organizer profile from database
  if (!id) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Organizer Profile</h1>
      <p className="text-gray-600">Organizer ID: {id}</p>
      <p className="text-gray-500 mt-4">Organizer details and upcoming rides will be displayed here.</p>
    </div>
  );
}
