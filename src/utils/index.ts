import type { EmergencyRequest } from "../types";

type DonationPayoutFields = Pick<
	EmergencyRequest,
	| "target_amount"
	| "payment_type"
	| "bank_account_name"
	| "bank_account_number"
	| "bank_name"
	| "receiving_mobile_provider"
	| "receiving_mobile_number"
>;

export function canRequestReceiveDonations(request: DonationPayoutFields): boolean {
	if (!request.target_amount || request.target_amount <= 0) {
		return false;
	}

	if (request.payment_type === "bank") {
		return Boolean(
			request.bank_account_name?.trim() &&
				request.bank_account_number?.trim() &&
				request.bank_name?.trim()
		);
	}

	if (request.payment_type === "mobile_money") {
		return Boolean(
			request.receiving_mobile_provider && request.receiving_mobile_number?.trim()
		);
	}

	return false;
}
