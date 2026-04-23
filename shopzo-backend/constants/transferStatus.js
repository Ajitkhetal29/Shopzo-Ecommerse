export const TRANSFER_STATUS_TRANSITIONS = {
  initiated: ["approved", "rejected", "cancelled"],
  approved: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: ["issue_reported", "completed"],
  issue_reported: ["completed"],
  rejected: [],
  cancelled: [],
  completed: [],
};

export const TRANSFER_ALLOWED_STATUSES = Object.keys(TRANSFER_STATUS_TRANSITIONS);

const isActorMatch = (expectedType, expectedId, actorType, actorId) => {
  if (!actorType || !actorId) return false;
  const normalizedExpectedId =
    expectedId && typeof expectedId === "object" && expectedId._id ? expectedId._id : expectedId;
  const normalizedActorId =
    actorId && typeof actorId === "object" && actorId._id ? actorId._id : actorId;

  return expectedType === actorType && String(normalizedExpectedId) === String(normalizedActorId);
};

export const canActorUpdateTransferStatus = (transfer, nextStatus, actorType, actorId) => {
  if (!actorType || !actorId) return false;

  const isFromActor = isActorMatch(transfer.fromType, transfer.fromId, actorType, actorId);
  const isToActor = isActorMatch(transfer.toType, transfer.toId, actorType, actorId);

  switch (nextStatus) {
    case "approved":
    case "rejected":
      return isToActor;
    case "shipped":
      return isFromActor;
    case "delivered":
      return isToActor;
    case "issue_reported":
      return transfer.status === "delivered" && isToActor;
    case "completed":
      return transfer.status === "delivered" && isToActor;
    case "cancelled":
      // initiated: only source (e.g. vendor) may cancel; destination cannot
      if (transfer.status === "initiated") {
        return isFromActor;
      }
      // approved: source or destination may cancel
      return isFromActor || isToActor;
    default:
      return false;
  }
};

export const getAllowedStatusesForTransfer = (transfer, actorType, actorId) => {
  const nextStatuses = [...(TRANSFER_STATUS_TRANSITIONS[transfer?.status] || [])];
  if (!actorType || !actorId) return [];

  return nextStatuses.filter((nextStatus) =>
    canActorUpdateTransferStatus(transfer, nextStatus, actorType, actorId)
  );
};
