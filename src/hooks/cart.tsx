import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storedProducts = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (storedProducts) {
        setProducts(JSON.parse(storedProducts));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      setProducts(state =>
        state.map(product => {
          if (product.id === id) {
            return { ...product, quantity: product.quantity + 1 };
          }
          return product;
        }),
      );

      AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    },
    [products],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      const productExists = products.find(
        productCompare => productCompare.id === product.id,
      );

      if (productExists) {
        increment(productExists.id);
        return;
      }

      setProducts([...products, { ...product, quantity: 1 }]);

      AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    },
    [increment, products],
  );

  const decrement = useCallback(
    async id => {
      setProducts(state =>
        state.map(product => {
          if (product.id === id) {
            if (product.quantity > 0) {
              return { ...product, quantity: product.quantity - 1 };
            }
          }

          return product;
        }),
      );

      AsyncStorage.setItem('@GoMarketplace:products', JSON.stringify(products));
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
