export type ApiResponse<T = any> = {
  success: boolean
  message: string
  data: T
}

export type ApiErrorDetail = {
  field?: string
  message: string
  value?: any
}

export type ApiErrorResponse = {
  success: false
  code: string
  message: string
  errors?: ApiErrorDetail[]
}

export type Role = "CUSTOMER" | "STAFF" | "ADMIN"

export type User = {
  id: string
  name: string
  email: string
  phone?: string
  role: Role
  isActive: boolean
  isBlacklisted: boolean
  noShowCount?: number
  blacklistStatus?: "ACTIVE" | "BLACKLISTED"
  blacklistedAt?: string | null
  blacklistReason?: string | null
  lastLoginAt?: string | null
  createdAt?: string
  updatedAt?: string
}

export type AuthResponseData = {
  user: User
  token: string
}

export type TableStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "OCCUPIED"
  | "CLEANING"
  | "OUT_OF_SERVICE"

export type TableShape = "ROUND" | "SQUARE" | "RECTANGLE"

export type TableLocation =
  | "WINDOW"
  | "BAR"
  | "CENTER"
  | "PRIVATE"
  | "OUTDOOR"
  | "OTHER"

export type Position = {
  x: number
  y: number
  rotation: number
}

export type Table = {
  id: string
  tableNumber: string
  name?: string
  capacity: number
  status: TableStatus
  shape: TableShape
  location: TableLocation
  tags: string[]
  position: Position
  isActive?: boolean
  notes?: string
}

export type LiveTable = Table & {
  tableStatus: TableStatus
  operationalState:
    | "OUT_OF_SERVICE"
    | "CLEANING"
    | "SEATED"
    | "ARRIVED"
    | "BOOKED"
    | "UPCOMING"
    | "AVAILABLE"
  currentBooking?: {
    bookingReference: string
    startTime: string
    endTime: string
    guests: number
    status: BookingStatus
    tableCount?: number
  } | null
  nextBooking?: {
    bookingReference: string
    startTime: string
    endTime: string
    guests: number
    status: BookingStatus
    tableCount?: number
  } | null
}

export type LiveFloorData = {
  date: string
  currentTime: string
  tables: LiveTable[]
}

export type ServiceWindow = {
  name: string
  startTime: string
  endTime: string
  lastBookingTime: string
  bookingDurationMinutes: number
  maxGuestsPerBooking: number
}

export type DaySchedule = {
  dayOfWeek: string
  isOpen?: boolean
  isConfigured?: boolean
  services?: ServiceWindow[]
}

export type AvailabilityResult = {
  available: boolean
  reason?: string | null
  date: string
  startTime: string
  endTime?: string | null
  guests: number
  closedReason?: string | null
  service?: ServiceWindow | null
  tables: Table[]
}

export type EffectiveSchedule = {
  date: string
  dayOfWeek: string
  isConfigured: boolean
  isClosed: boolean
  reason?: string
  services: ServiceWindow[]
}

export type ClosedDay = {
  id?: string
  _id?: string
  date: string
  reason?: string
  isActive?: boolean
  createdAt?: string
}

export type TableRecommendation = {
  rank: number
  score: number
  table: Table
  breakdown: {
    base: number
    capacityWaste: number
    capacity: number
    location: { requested: boolean; matched: boolean; points: number }
    shape: { requested: boolean; matched: boolean; points: number }
    tag: { requested: boolean; matched: boolean; points: number }
  }
}

export type RecommendationResult = {
  available: boolean
  reason: string | null
  date: string
  startTime: string
  endTime: string | null
  guests: number
  closedReason: string | null
  service: ServiceWindow | null
  preferences: {
    location: string | null
    shape: string | null
    tag: string | null
  }
  recommendations: TableRecommendation[]
}

export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "ARRIVED"
  | "SEATED"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW"

export type BookingHistoryEntry = {
  action: string
  fromStatus?: string
  toStatus?: string
  actorId?: string
  at: string
  reason?: string
  fromSlot?: {
    date: string
    startTime: string
    endTime: string
    tableId: string
    serviceName: string
  }
  toSlot?: {
    date: string
    startTime: string
    endTime: string
    tableId: string
    serviceName: string
  }
}

export type Booking = {
  id: string
  bookingReference: string
  customerId: string
  tableId: string
  tableIds: string[]
  date: string
  startTime: string
  endTime: string
  guests: number
  serviceName: string
  source: "WEBSITE" | "PHONE" | "WHATSAPP" | "STAFF" | "ADMIN"
  status: BookingStatus
  depositRequired?: boolean
  depositAmount?: number
  depositStatus?: "NOT_REQUIRED" | "PENDING" | "PAID" | "REFUNDED" | "FAILED"
  paymentReference?: string | null
  notes?: string
  cancellationReason?: string
  cancelledAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
  table?: Table
  tables?: Table[]
  history?: BookingHistoryEntry[]
}

export type WaitlistStatus =
  | "WAITING"
  | "NOTIFIED"
  | "CONVERTED"
  | "CANCELLED"
  | "EXPIRED"

export type WaitlistEntry = {
  id: string
  waitlistReference: string
  customerId: string
  date: string
  requestedStartTime: string
  guests: number
  serviceName: string
  status: WaitlistStatus
  source: string
  notes?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export type NotificationType =
  | "BOOKING_CREATED"
  | "BOOKING_UPDATED"
  | "BOOKING_CANCELLED"
  | "BOOKING_ARRIVED"
  | "BOOKING_SEATED"
  | "BOOKING_COMPLETED"
  | "BOOKING_NO_SHOW"
  | "BOOKING_REMINDER"
  | "WAITLIST_CREATED"
  | "WAITLIST_NOTIFIED"
  | "WAITLIST_CONVERTED"
  | "WAITLIST_CANCELLED"

export type NotificationItem = {
  id: string
  notificationReference: string
  type: NotificationType
  recipientUserId: string
  bookingReference?: string
  waitlistReference?: string
  title: string
  message: string
  channel: "IN_APP" | "EMAIL" | "WHATSAPP"
  status: "UNREAD" | "READ"
  metadata?: Record<string, any>
  readAt?: string | null
  createdAt: string
  updatedAt: string
}

export type ConfigurationState = "ENABLED" | "DISABLED" | "NOT_CONFIGURED"

export type JobStatusItem = {
  name: string
  configuration?: ConfigurationState
  enabled: boolean
  running: boolean
  lastRunAt: string | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
}

export type AdminJobStatus = {
  jobsEnabled: boolean
  scheduler?: ConfigurationState
  schedule?: string
  intervalMinutes?: number
  reminderWindowMinutes?: number
  expiryWindowHours?: number
  jobs: JobStatusItem[]
}

export type DashboardBookingCounts = {
  total: number
  confirmed: number
  arrived: number
  seated: number
  completed: number
  cancelled: number
  noShow: number
}

export type DashboardGuestCounts = {
  total: number
  confirmed: number
  arrived: number
  seated: number
  completed: number
}

export type DashboardTableCounts = {
  total: number
  available: number
  reserved: number
  occupied: number
  cleaning: number
  outOfService: number
}

export type DashboardWaitlistCounts = {
  waiting: number
  notified: number
  converted: number
  cancelled: number
  expired: number
}

export type DashboardOverview = {
  date: string
  bookings: DashboardBookingCounts
  guests: DashboardGuestCounts
  tables: DashboardTableCounts
  waitlist: DashboardWaitlistCounts
}

export type DashboardBookingAnalytics = {
  date: string
  total: number
  byStatus: Record<string, number>
  bySource: Record<string, number>
  totalGuests: number
  averageGuestsPerBooking: number
  groupBookingCount: number
  singleTableBookingCount: number
}

export type DashboardHour = {
  time: string
  bookings: number
  guests: number
}

export type DashboardHourly = {
  date: string
  hours: DashboardHour[]
}

export type DashboardServiceRow = {
  serviceName: string
  bookings: number
  guests: number
  averageGuests: number
  cancelled: number
  completed: number
  noShow: number
}

export type DashboardServices = {
  date: string
  services: DashboardServiceRow[]
}

export type DashboardTableRow = {
  tableId: string
  tableNumber: string
  capacity: number
  bookingCount: number
  guestCount: number
  completedCount: number
  cancelledCount: number
  utilizationMinutes: number
}

export type DashboardTables = {
  date: string
  tables: DashboardTableRow[]
}

export type DashboardWaitlistAnalytics = {
  date: string | null
  total: number
  waiting: number
  notified: number
  converted: number
  cancelled: number
  expired: number
  conversionRate: number
}

export type DashboardLiveSummary = {
  available: number
  upcoming: number
  booked: number
  arrived: number
  seated: number
  cleaning: number
  outOfService: number
}

export type DashboardLive = {
  businessDate: string
  currentTime: string
  summary: DashboardLiveSummary
  tables: LiveTable[]
}

export type DashboardActivityEvent = {
  type: string
  reference: string
  timestamp: string
  status: string | null
}

export type DashboardActivity = {
  events: DashboardActivityEvent[]
}

export type EventStatus = "DRAFT" | "PUBLISHED" | "CANCELLED" | "COMPLETED" | "ARCHIVED"
export type NewsStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED"

export type RestaurantEvent = {
  id: string
  title: string
  slug: string
  description: string
  shortDescription: string
  imageUrl: string | null
  location: string
  startDate: string
  endDate: string
  startTime: string
  endTime: string | null
  status: EventStatus
  isPublished: boolean
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  archivedAt?: string | null
}

export type NewsArticle = {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  imageUrl: string | null
  status: NewsStatus
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  createdBy?: string | null
  archivedAt?: string | null
}

export type DepositType = "PER_GUEST" | "FLAT"

export type DepositStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "REFUNDED" | "FAILED"

export type PaymentStatus = "CREATED" | "PENDING" | "PAID" | "FAILED" | "CANCELLED" | "REFUNDED"

export type DepositConfig = {
  id: string
  enabled: boolean
  type: DepositType
  amount: number
  currency: string
  minGuests: number
  refundCutoffHours: number
  updatedAt: string
}

export type Payment = {
  id: string
  paymentReference: string
  bookingReference: string
  bookingId: string
  customerId: string
  amount: number
  currency: string
  provider: string
  providerOrderId?: string | null
  providerPaymentId?: string | null
  status: PaymentStatus
  type: string
  paidAt?: string | null
  refundedAt?: string | null
  refundAmount?: number | null
  refundReason?: string | null
  createdAt: string
  updatedAt: string
}

export type PaymentOrder = {
  provider: string
  providerOrderId: string
  providerSignature: string
  clientSecret: string
  amount: number
  currency: string
  instructions?: string
  paymentReference?: string
}

