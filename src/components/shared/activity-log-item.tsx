import { ActivityLog } from "@/lib/types"
import { formatRelativeTime } from "@/lib/utils"
import { 
  LogIn, 
  PlusCircle, 
  FileEdit, 
  Trash2, 
  Printer, 
  Settings,
  Circle
} from "lucide-react"

interface ActivityLogItemProps {
  activity: ActivityLog
}

function getIconElement(activity: ActivityLog) {
  const props = { className: "w-4 h-4" }
  
  if (activity.action.includes("Login") || activity.action.includes("Logout")) return <LogIn {...props} />
  if (activity.action.includes("Print")) return <Printer {...props} />
  if (activity.type === "CREATE") return <PlusCircle {...props} />
  if (activity.type === "DELETE") return <Trash2 {...props} />
  if (activity.action.includes("Settings")) return <Settings {...props} />
  if (activity.type === "UPDATE") return <FileEdit {...props} />
  
  return <Circle {...props} />
}

function getIconColor(activity: ActivityLog) {
  if (activity.type === "CREATE") return "text-green-600 bg-green-50"
  if (activity.type === "DELETE") return "text-red-600 bg-red-50"
  if (activity.type === "UPDATE") return "text-blue-600 bg-blue-50"
  return "text-gray-600 bg-gray-50"
}

export function ActivityLogItem({ activity }: ActivityLogItemProps) {
  const iconElement = getIconElement(activity)
  const iconColorClass = getIconColor(activity)

  return (
    <div className="flex gap-3 py-3">
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${iconColorClass}`}>
        {iconElement}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {activity.userName} <span className="text-gray-500 font-normal">({activity.userRole})</span>
        </p>
        <p className="text-sm text-gray-600">
          <span className="font-semibold">{activity.action}</span>
          {activity.details && <span>: {activity.details}</span>}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {formatRelativeTime(activity.timestamp)}
        </p>
      </div>
    </div>
  )
}
