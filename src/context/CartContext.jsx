import React, { createContext, useContext, useReducer, useEffect } from 'react';

const CartContext = createContext();

const cartReducer = (state, action) => {
    switch (action.type) {
        case 'ADD_TO_CART':
            const existingItem = state.items.find(item => item.id === action.payload.id);
            if (existingItem) {
                return {
                    ...state,
                    items: state.items.map(item =>
                        item.id === action.payload.id
                            ? { ...item, quantity: item.quantity + action.payload.quantity }
                            : item
                    )
                };
            } else {
                return {
                    ...state,
                    items: [...state.items, { ...action.payload, productQuantity: action.payload.productQuantity }]
                };
            }

        case 'REMOVE_FROM_CART':
            return {
                ...state,
                items: state.items.filter(item => item.id !== action.payload)
            };

        case 'UPDATE_QUANTITY':
            return {
                ...state,
                items: state.items.map(item =>
                    item.id === action.payload.id
                        ? { ...item, quantity: action.payload.quantity }
                        : item
                )
            };

        case 'CLEAR_CART':
            return {
                ...state,
                items: []
            };

        case 'LOAD_CART':
            return {
                ...state,
                items: action.payload
            };

        default:
            return state;
    }
};

export const CartProvider = ({ children }) => {
    const [state, dispatch] = useReducer(cartReducer, {
        items: []
    });

    // Load cart from localStorage on mount
    useEffect(() => {
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
            try {
                const parsedCart = JSON.parse(savedCart);
                if (parsedCart.items) {
                    dispatch({ type: 'LOAD_CART', payload: parsedCart.items });
                }
            } catch (error) {
                console.error('Error loading cart from localStorage:', error);
            }
        }
    }, []);

    // Save cart to localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(state));
    }, [state]);

    const addToCart = (product, quantity = 1) => {
        // Check if we already have this item in cart
        const existingItem = state.items.find(item => item.id === product.id);
        const currentCartQuantity = existingItem ? existingItem.quantity : 0;
        const totalRequestedQuantity = currentCartQuantity + quantity;

        // Check if total quantity exceeds available stock
        if (totalRequestedQuantity > product.quantity) {
            const availableToAdd = product.quantity - currentCartQuantity;
            if (availableToAdd <= 0) {
                throw new Error(`You already have the maximum available quantity of ${product.name} in your cart`);
            } else {
                throw new Error(`You can only add ${availableToAdd} more ${product.name} to your cart`);
            }
        }

        dispatch({
            type: 'ADD_TO_CART',
            payload: {
                id: product.id,
                name: product.name,
                price: product.price,
                imageUrl: product.imageUrls?.[0] || null,
                quantity: quantity,
                productQuantity: product.quantity // Store the original stock quantity
            }
        });
    };

    const removeFromCart = (productId) => {
        dispatch({
            type: 'REMOVE_FROM_CART',
            payload: productId
        });
    };

    const updateQuantity = (productId, quantity) => {
        if (quantity <= 0) {
            removeFromCart(productId);
        } else {
            // Find the product to check stock
            const item = state.items.find(item => item.id === productId);
            if (item && item.productQuantity && quantity > item.productQuantity) {
                throw new Error(`Cannot update quantity to ${quantity}. Only ${item.productQuantity} available in stock.`);
            }

            dispatch({
                type: 'UPDATE_QUANTITY',
                payload: { id: productId, quantity }
            });
        }
    };

    const clearCart = () => {
        dispatch({ type: 'CLEAR_CART' });
    };

    const getCartTotal = () => {
        return state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    };

    const getCartCount = () => {
        return state.items.reduce((count, item) => count + item.quantity, 0);
    };

    const value = {
        items: state.items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getCartTotal,
        getCartCount
    };

    return (
        <CartContext.Provider value={value}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
