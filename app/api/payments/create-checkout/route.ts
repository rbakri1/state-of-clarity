import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/client';
import { createServerSupabaseClient, type Database } from '@/lib/supabase/client';

type CreditPackage = Database['public']['Tables']['credit_packages']['Row'];

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in to purchase credits.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { package_id } = body;

    if (!package_id) {
      return NextResponse.json(
        { error: 'Missing package_id in request body' },
        { status: 400 }
      );
    }

    const { data, error: packageError } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('id', package_id)
      .single();

    const creditPackage = data as CreditPackage | null;

    if (packageError || !creditPackage) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      );
    }

    if (!creditPackage.active) {
      return NextResponse.json(
        { error: 'This package is no longer available' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: {
              name: `${creditPackage.name} - ${creditPackage.credits} Credits`,
              description: `Purchase ${creditPackage.credits} credits for State of Clarity`,
            },
            unit_amount: Math.round(creditPackage.price_gbp * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/credits`,
      metadata: {
        user_id: user.id,
        package_id: creditPackage.id,
        credits: creditPackage.credits.toString(),
      },
      payment_intent_data: {
        metadata: {
          user_id: user.id,
          package_id: creditPackage.id,
          credits: creditPackage.credits.toString(),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
