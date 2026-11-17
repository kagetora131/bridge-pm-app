/** 削除したときの「元に戻す」を出すための関数(App が用意して、各画面に渡す)。 */
export type OfferUndo = (message: string, restore: () => void) => void;

/** 元の位置(index)に項目を戻す。すでに同じ id の項目があれば何もしない(二重に戻さない)。 */
export function insertAt<T extends { id: string }>(list: T[], index: number, item: T): T[] {
  if (list.some((x) => x.id === item.id)) return list;
  const next = list.slice();
  next.splice(Math.min(Math.max(index, 0), next.length), 0, item);
  return next;
}
