import { NextResponse } from "next/server";

// In-memory device registry
// For a single-user app, this is sufficient. Vercel keeps function instances
// warm for ~5 minutes, and the Pi heartbeats every 30s to keep it alive.
// On cold start, the Pi re-registers within 30s.
const deviceRegistry = (globalThis as Record<string, unknown>).__clawDevices as Map<string, { tunnelUrl: string; hostname: string; lastSeen: number }>
  ?? new Map<string, { tunnelUrl: string; hostname: string; lastSeen: number }>();
(globalThis as Record<string, unknown>).__clawDevices = deviceRegistry;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceId, tunnelUrl, hostname } = body;

    if (!deviceId || !tunnelUrl) {
      return NextResponse.json({ error: "deviceId and tunnelUrl required" }, { status: 400 });
    }

    deviceRegistry.set(deviceId, {
      tunnelUrl,
      hostname: hostname || "unknown",
      lastSeen: Date.now(),
    });

    return NextResponse.json({ ok: true, deviceId });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}

export async function GET() {
  // List all registered devices (for the dashboard to auto-discover)
  const devices: Record<string, { tunnelUrl: string; hostname: string; lastSeen: number; age: string }> = {};
  const now = Date.now();

  deviceRegistry.forEach((value, key) => {
    const ageMs = now - value.lastSeen;
    // Only show devices seen in the last 5 minutes
    if (ageMs < 5 * 60 * 1000) {
      devices[key] = {
        ...value,
        age: ageMs < 60000 ? `${Math.round(ageMs / 1000)}s ago` : `${Math.round(ageMs / 60000)}m ago`,
      };
    }
  });

  return NextResponse.json({ devices, count: Object.keys(devices).length });
}
