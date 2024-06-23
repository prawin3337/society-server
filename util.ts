export const maintenanceRules = {
    maintenanceDetails: {
        creditAmount: 1500,
        ruleDate: new Date("2021-12-01")
    },
    latePayment: {
        penaltyAmt: 100,
        latePayDate: 15,
        ruleDate: new Date("2023-05-15 23:59:59"),
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

export function transformDate(date: Date) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];
    return `${date.getDate()}-${monthNames[date.getMonth()]}-${date.getFullYear()}`;
}

export function toMySQLDate(date: Date) {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}