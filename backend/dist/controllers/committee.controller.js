import { Store } from "../services/store.js";
import { asyncHandler, ApiError } from "../middleware/errorHandler.js";
export const CommitteeController = {
    getDashboard: asyncHandler(async (req, res) => {
        const [pendingNOCs, stats, meetings, snapshot, recentActions, fundBalances, vendorPayments, nocTypes, monthlyCollection, user,] = await Promise.all([
            Store.getPendingNOCs(),
            Store.getCommitteeStats(),
            Store.getMeetings(),
            Store.getMonthlySnapshot(),
            Store.getRecentActions(),
            Store.getFundBalances(),
            Store.getVendorPayments(),
            Store.getNOCTypes(),
            Store.getMonthlyCollectionChart(),
            // The signed-in member, not "anybody with the committee role" — the
            // dashboard is signed with the member's name and designation.
            Store.getUserById(req.user.id),
        ]);
        if (!user) {
            throw new ApiError(404, "Committee member profile not found");
        }
        res.json({
            success: true,
            message: "Committee dashboard fetched successfully",
            data: {
                pendingNOCs,
                stats,
                meetings,
                snapshot,
                recentActions,
                fundBalances,
                vendorPayments,
                nocTypes,
                monthlyCollection,
                memberName: user.name,
                designation: user.designation,
                societyName: "Harmony Heights",
            },
        });
    }),
    updateNOC: asyncHandler(async (req, res) => {
        const { status, reason } = req.body;
        const result = await Store.updateNOCStatus(String(req.params.id), status, reason);
        if (!result.success) {
            throw new ApiError(404, result.message);
        }
        res.json({
            success: true,
            message: `NOC ${status} successfully`,
            data: { noc: result.noc },
        });
    }),
};
