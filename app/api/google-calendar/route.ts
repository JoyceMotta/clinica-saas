import { getServerSession } from 'next-auth/next';
import { google } from 'googleapis';
import { authOptions } from '@/lib/nextauth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  const accessToken = (session as Record<string, unknown> | null)?.accessToken as string | undefined;

  if (!accessToken) {
    return Response.json({ events: [], connected: false });
  }

  try {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    oauth2.setCredentials({ access_token: accessToken });

    const cal = google.calendar({ version: 'v3', auth: oauth2 });

    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin') ?? new Date(Date.now() - 30 * 86400000).toISOString();
    const timeMax = searchParams.get('timeMax') ?? new Date(Date.now() + 90 * 86400000).toISOString();

    const res = await cal.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 500,
    });

    return Response.json({ events: res.data.items ?? [], connected: true });
  } catch (err) {
    console.error('[google-calendar]', err);
    return Response.json({ events: [], connected: true, error: 'fetch_failed' });
  }
}
