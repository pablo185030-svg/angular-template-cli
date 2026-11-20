/** A product as returned by the API. */
export interface Product {
  id: number;
  name: string;
  /** Unit price. */
  price: number;
  /** Units available. */
  stock: number;
}

/** The editable fields of a product (what the form sends on create and update). */
export type ProductInput = Omit<Product, 'id'>;
