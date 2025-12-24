import { useState, useCallback } from 'react';
import { Partner } from '@/types/partner';
import { mockPartners } from '@/data/mockPartners';
import { useToast } from '@/hooks/use-toast';

const WEBHOOK_URL = 'https://n8nlocal.benceaiproject.uk/webhook-test/42275bdc-cab0-46a4-83be-989d0f937d52';

export const usePartnerData = () => {
  const [partners, setPartners] = useState<Partner[]>(mockPartners);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const fetchPartners = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP hiba: ${response.status}`);
      }

      const data = await response.json();
      
      // Handle different response formats
      const partnersData = Array.isArray(data) ? data : data.partners || data.data || [];
      
      if (partnersData.length > 0) {
        setPartners(partnersData);
        toast({
          title: 'Sikeres frissítés',
          description: `${partnersData.length} partner adat betöltve.`,
        });
      } else {
        toast({
          title: 'Nincs adat',
          description: 'A webhook nem küldött partner adatokat.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Webhook hiba:', error);
      toast({
        title: 'Hiba történt',
        description: 'Nem sikerült lekérni az adatokat a webhookból.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  return {
    partners,
    isLoading,
    fetchPartners,
  };
};
