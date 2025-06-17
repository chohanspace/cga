
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, Construction } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LiveChatComingSoonPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/'); // Navigate back to the main AI chat page
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-8 text-center">
      <Construction className="h-24 w-24 text-primary mb-8 animate-bounce" />
      <h1 className="text-4xl font-bold text-primary mb-4">Coming Soon!</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        Our Live Group Chat feature is currently under construction. We&apos;re working hard to bring it to you. Stay tuned!
      </p>
      <Button onClick={handleGoBack} size="lg">
        <ArrowLeft className="mr-2 h-5 w-5" />
        Back to AI Chat
      </Button>
    </div>
  );
}
