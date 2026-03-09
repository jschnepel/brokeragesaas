'use server';

interface ContactFormState {
  success: boolean;
  error: string | null;
}

export async function submitContactForm(
  _prev: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;
  const phone = (formData.get('phone') as string) || null;
  const interest = (formData.get('interest') as string) || null;
  const message = (formData.get('message') as string) || null;

  if (!name || !email) {
    return { success: false, error: 'Name and email are required.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  try {
    // Import database client dynamically to keep it server-only
    const { query } = await import('@platform/database');

    await query(
      `INSERT INTO leads (agent_id, name, email, phone, message, source, metadata)
       VALUES (
         (SELECT id FROM agents LIMIT 1),
         $1, $2, $3, $4, 'website',
         $5::jsonb
       )`,
      [
        name,
        email,
        phone,
        message,
        JSON.stringify({ interest, submitted_at: new Date().toISOString() }),
      ],
    );

    return { success: true, error: null };
  } catch (err) {
    console.error('Contact form submission failed:', err);
    return {
      success: false,
      error: 'Something went wrong. Please try again or contact us directly.',
    };
  }
}
