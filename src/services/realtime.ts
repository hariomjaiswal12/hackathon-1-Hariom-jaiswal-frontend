import { io, type Socket } from "socket.io-client"
import { apiOrigin } from "./apiClient"

const FLOOR_EVENTS = [
  "booking:created",
  "booking:updated",
  "booking:cancelled",
  "booking:arrived",
  "booking:seated",
  "booking:completed",
  "booking:no_show",
  "table:updated",
  "waitlist:created",
  "waitlist:updated",
  "waitlist:cancelled",
] as const

type Listener = () => void

let socket: Socket | null = null
const floorListeners = new Set<Listener>()
const notificationListeners = new Set<Listener>()

function emit(listeners: Set<Listener>) {
  listeners.forEach((listener) => listener())
}

export function subscribeFloorUpdates(listener: Listener) {
  floorListeners.add(listener)
  return () => {
    floorListeners.delete(listener)
  }
}

export function subscribeNotificationUpdates(listener: Listener) {
  notificationListeners.add(listener)
  return () => {
    notificationListeners.delete(listener)
  }
}

export function connectRealtime(token: string) {
  disconnectRealtime()
  socket = io(apiOrigin(), {
    auth: { token },
    transports: ["websocket", "polling"],
  })

  FLOOR_EVENTS.forEach((eventName) => {
    socket?.on(eventName, () => emit(floorListeners))
  })
  socket.on("notification:new", () => emit(notificationListeners))
}

export function disconnectRealtime() {
  socket?.removeAllListeners()
  socket?.disconnect()
  socket = null
}
