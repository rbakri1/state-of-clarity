import { NextResponse } from 'next/server';
import { createServerSupabaseClient, type Database } from '@/lib/supabase/client';
import { getBalance } from '@/lib/services/credit-service';

type CreditPackage = Database['public']['Tables']['credit_packages']['Row'];

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view credits.' },
        { status: 401 }
      );
    }

    const { data, error: packagesError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('active', true)
      .order('credits', { ascending: true });

    const packages = data as CreditPackage[] | null;

    if (packagesError) {
      console.error('Error fetching packages:', packagesError);
      return NextResponse.json(
        { error: 'Failed to fetch credit packages' },
        { status: 500 }
      );
    }

    const balance = await getBalance(user.id);

    return NextResponse.json({
      balance,
      packages: packages ?? [],
    });
  } catch (error) {
    console.error('Error in credits API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
