import { NextResponse } from "next/server";

// Same global registry as /api/register
const deviceRegistry = (globalThis as Record<string, unknown>).__clawDevices as Map<string, { tunnelUrl: string; hostname: string; lastSeen: number }>
  ?? new Map<string, { tunnelUrl: string; hostname: string; lastSeen: number }>();
(globalThis as Record<string, unknown>).__clawDevices = deviceRegistry;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const deviceId = url.searchParams.get("id");

  // If a specific device ID is requested
  if (deviceId) {
    const device = deviceRegistry.get(deviceId);
    if (!device) {
      return NextResponse.json({ error: "Device not found", deviceId }, { status: 404 });
    }
    const ageMs = Date.now() - device.lastSeen;
    if (ageMs > 5 * 60 * 1000) {
      return NextResponse.json({ error: "Device offline (last seen >5m ago)", deviceId }, { status: 404 });
    }
    return NextResponse.json({
      deviceId,
      tunnelUrl: device.tunnelUrl,
      hostname: device.hostname,
      lastSeen: device.lastSeen,
      age: ageMs < 60000 ? `${Math.round(ageMs / 1000)}s ago` : `${Math.round(ageMs / 60000)}m ago`,
    });
  }

  // No ID specified - return the most recently registered device (for single-user simplicity)
  let latest: { key: string; tunnelUrl: string; hostname: string; lastSeen: number } | null = null;
  const now = Date.now();

  deviceRegistry.forEach((value, key) => {
    const ageMs = now - value.lastSeen;
    if (ageMs < 5 * 60 * 1000) {
      if (!latest || value.lastSeen > latest.lastSeen) {
        latest = { key, ...value };
      }
    }
  });

  if (!latest) {
    return NextResponse.json({ error: "No devices registered. Run the setup script on your Pi first." }, { status: 404 });
  }

  return NextResponse.json({
    deviceId: (latest as { key: string }).key,
    tunnelUrl: (latest as { tunnelUrl: string }).tunnelUrl,
    hostname: (latest as { hostname: string }).hostname,
    lastSeen: (latest as { lastSeen: number }).lastSeen,
  });
}
