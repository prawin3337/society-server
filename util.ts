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