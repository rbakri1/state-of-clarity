import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, type Database } from '@/lib/supabase/client';

type CreditTransaction = Database['public']['Tables']['credit_transactions']['Row'];

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to view transaction history.' },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const offset = (page - 1) * PAGE_SIZE;

    const { count: totalCount } = await supabase
      .from('credit_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    const transactions = data as CreditTransaction[] | null;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transaction history' },
        { status: 500 }
      );
    }

    const totalPages = Math.ceil((totalCount ?? 0) / PAGE_SIZE);

    return NextResponse.json({
      transactions: transactions ?? [],
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        totalCount: totalCount ?? 0,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Error in credits history API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
