import { Link } from "react-router-dom";
import type { EmergencyRequest } from "../../types";

export const TYPE_BADGE: Record<EmergencyRequest["type"], string> = {
  medical: "bg-red-100 text-red-700",
  food: "bg-yellow-100 text-yellow-700",
  rescue: "bg-blue-100 text-blue-700",
  shelter: "bg-green-100 text-green-700",
};

export const STATUS_BADGE: Record<EmergencyRequest["status"], string> = {
  pending: "bg-yellow-100 text-yellow-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
  closed: "bg-gray-100 text-gray-600",
};

interface Props {
  request: EmergencyRequest;
}

const RequestCard = ({ request }: Props) => {
  const formattedDate = new Date(request.createdAt).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
      {/* Type + status badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${TYPE_BADGE[request.type]}`}
        >
          {request.type}
        </span>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[request.status]}`}
        >
          {request.status}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 text-base leading-snug">
        {request.title}
      </h3>

      {/* Description — clamped to 2 lines */}
      <p className="text-sm text-gray-500 line-clamp-2">{request.description}</p>

      {/* Location */}
      <p className="text-xs text-gray-400 flex items-center gap-1">
        <span>&#128205;</span>
        {request.locationName}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <span className="text-xs text-gray-400">{formattedDate}</span>
        <Link
          to={`/requests/${request.id}`}
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default RequestCard;
