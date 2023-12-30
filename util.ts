export const maintenanceRules = {
    maintenanceDetails: {
        creditAmount: 1500,
        ruleDate: "2021-12-01"
    },
    latePayment: {
        penaltyAmt: 100,
        ruleDate: "2023-05-01",
        applied: "per-month"
    }
}

export function transformKeys(mapObj: any, obj: any) {
    return Object.fromEntries(
        Object.entries(obj)
            .map(([k, v]) => [mapObj.get(k) || k, v])
    )
}

export function transformMap(data: any[], map: Map<string, string>): any[] {
    let result:any[] = [];
    data.forEach((o) => {
        result.push(transformKeys(map, o));
    });
    return result;
}