import { NextResponse } from "next/server";
import { logActivity } from "@/lib/activity";
import { currentUser } from "@/lib/auth";
import { can } from "@/lib/roles";
import { getSiteConfig, saveSiteSetting, type ChatSettings, type PopupSettings } from "@/lib/site-config";

export const dynamic = "force-dynamic";

/** Admin read/update of the public site configuration (chat, popups, contact). */
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json(await getSiteConfig());
}

export async function PUT(request: Request) {
  const user = await currentUser();
  if (!user || !can(user.role, "manage_forms")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: {
    chat?: Partial<ChatSettings>;
    calendlyUrl?: string;
    phone?: string;
    popups?: Partial<PopupSettings>;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const current = await getSiteConfig();

  if (body.chat) {
    const chat: ChatSettings = {
      enabled: typeof body.chat.enabled === "boolean" ? body.chat.enabled : current.chat.enabled,
      teaser: typeof body.chat.teaser === "boolean" ? body.chat.teaser : current.chat.teaser,
      sound: typeof body.chat.sound === "boolean" ? body.chat.sound : current.chat.sound,
    };
    await saveSiteSetting("chat_settings", chat, user.id);
    await logActivity(user, "chat", "updated settings", `chat ${chat.enabled ? "enabled" : "disabled"}`, "chat-settings");
  }

  if (typeof body.calendlyUrl === "string" || typeof body.phone === "string") {
    await saveSiteSetting(
      "site_contact",
      {
        calendlyUrl: typeof body.calendlyUrl === "string" && body.calendlyUrl.trim() ? body.calendlyUrl.trim() : current.calendlyUrl,
        phone: typeof body.phone === "string" && body.phone.trim() ? body.phone.trim() : current.phone,
      },
      user.id,
    );
  }

  if (body.popups) {
    const popups: PopupSettings = {
      getStartedTitle: body.popups.getStartedTitle?.toString().slice(0, 200) || current.popups.getStartedTitle,
      getStartedSuccess: body.popups.getStartedSuccess?.toString().slice(0, 500) || current.popups.getStartedSuccess,
      termsTitle: body.popups.termsTitle?.toString().slice(0, 200) || current.popups.termsTitle,
      termsUpdated: body.popups.termsUpdated?.toString().slice(0, 100) || current.popups.termsUpdated,
      termsBody: typeof body.popups.termsBody === "string" ? body.popups.termsBody.slice(0, 40000) : current.popups.termsBody,
    };
    await saveSiteSetting("popup_settings", popups, user.id);
    await logActivity(user, "settings", "updated popups", "site popups", "popup-settings");
  }

  return NextResponse.json(await getSiteConfig());
}
