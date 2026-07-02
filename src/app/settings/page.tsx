import { createClient } from "@/lib/supabase/server";
import { getPreferences } from "@/lib/preferences";
import { Header } from "@/components/Header";
import { SettingsClient } from "@/components/settings/SettingsClient";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware guards this route, but guard again for type-safety.
  if (!user) return null;

  const preferences = await getPreferences(supabase, user.id);

  return (
    <div className="min-h-dvh">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <SettingsClient email={user.email ?? ""} preferences={preferences} />
      </main>
    </div>
  );
}
