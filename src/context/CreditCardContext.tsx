import React, { createContext, useContext, useState, useEffect } from 'react';
import { CreditCardContextType, CreditCard } from '@/lib/types';
import { useAuth } from './AuthContext';
import { useToast } from "@/hooks/use-toast";

const CreditCardContext = createContext<CreditCardContextType | undefined>(undefined);

const CREDIT_CARDS_STORAGE_KEY = 'suryabank_credit_cards';

export const CreditCardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const generateCardNumber = (): string => {
    // Generate a 16-digit card number starting with 4 (Visa format)
    const prefix = '4';
    const randomDigits = Array.from({ length: 15 }, () => 
      Math.floor(Math.random() * 10)
    ).join("");
    return `${prefix}${randomDigits}`;
  };

  const generateCVV = (): string => {
    return Array.from({ length: 3 }, () => 
      Math.floor(Math.random() * 10)
    ).join("");
  };

  const getExpiryDate = (validityYears: number = 10): Date => {
    const now = new Date();
    return new Date(now.getFullYear() + validityYears, now.getMonth(), now.getDate());
  };

  const createCreditCard = async (cardholderName: string, pin: string): Promise<void> => {
    setLoading(true);
    
    try {
      if (!user) throw new Error('User not authenticated');
      if (pin.length !== 6) throw new Error('PIN must be exactly 6 digits');
      
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      
      // Check if user already has a credit card
      const userHasCard = existingCards.some((card: CreditCard) => card.userId === user.id);
      if (userHasCard) {
        throw new Error('You already have a credit card. Only one card per user is allowed.');
      }
      
      const newCard: CreditCard = {
        id: Date.now().toString(),
        userId: user.id,
        cardNumber: generateCardNumber(),
        cardholderName,
        cvv: generateCVV(),
        expiryDate: getExpiryDate(10),
        pin: btoa(pin), // Simple encoding for demo
        isActive: true,
        isBlocked: false,
        failedAttempts: 0,
        permanentlyBlocked: false,
        validityYears: 10,
        createdAt: new Date()
      };
      
      existingCards.push(newCard);
      localStorage.setItem(CREDIT_CARDS_STORAGE_KEY, JSON.stringify(existingCards));
      
      await getUserCreditCards();
      
      toast({
        title: "Credit Card Created",
        description: `Your credit card has been created successfully. Card Number: ${newCard.cardNumber}`,
      });
    } catch (error: any) {
      toast({
        title: "Card Creation Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const validateCreditCard = async (cardNumber: string, pin: string): Promise<boolean> => {
    try {
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      const card = existingCards.find((c: CreditCard) => c.cardNumber === cardNumber);
      
      if (!card) return false;
      if (card.permanentlyBlocked) return false;
      if (card.isBlocked) return false;
      
      // Check temporary block
      if (card.temporaryBlockUntil && new Date() < new Date(card.temporaryBlockUntil)) {
        return false;
      }
      
      // Validate PIN
      if (atob(card.pin) !== pin) {
        await recordFailedAttempt(cardNumber);
        return false;
      }
      
      // Reset failed attempts on successful validation
      card.failedAttempts = 0;
      card.lastUsed = new Date();
      localStorage.setItem(CREDIT_CARDS_STORAGE_KEY, JSON.stringify(existingCards));
      
      return true;
    } catch (error) {
      console.error('Credit card validation error:', error);
      return false;
    }
  };

  const recordFailedAttempt = async (cardNumber: string): Promise<void> => {
    try {
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      const cardIndex = existingCards.findIndex((c: CreditCard) => c.cardNumber === cardNumber);
      
      if (cardIndex === -1) return;
      
      existingCards[cardIndex].failedAttempts += 1;
      
      if (existingCards[cardIndex].failedAttempts >= 3) {
        if (existingCards[cardIndex].temporaryBlockUntil && 
            new Date() < new Date(existingCards[cardIndex].temporaryBlockUntil)) {
          // Second failure during temporary block period - permanent block
          existingCards[cardIndex].permanentlyBlocked = true;
          existingCards[cardIndex].isBlocked = true;
          
          toast({
            title: "Card Permanently Blocked",
            description: `Card ending in ${cardNumber.slice(-4)} has been permanently blocked. Contact admin at suryaannarayan@gmail.com`,
            variant: "destructive"
          });
        } else {
          // First failure - 12 hour temporary block
          const blockUntil = new Date();
          blockUntil.setHours(blockUntil.getHours() + 12);
          existingCards[cardIndex].temporaryBlockUntil = blockUntil;
          existingCards[cardIndex].isBlocked = true;
          
          toast({
            title: "Card Temporarily Blocked",
            description: "Card blocked for 12 hours due to 3 failed PIN attempts",
            variant: "destructive"
          });
        }
      }
      
      localStorage.setItem(CREDIT_CARDS_STORAGE_KEY, JSON.stringify(existingCards));
      await getUserCreditCards();
    } catch (error) {
      console.error('Error recording failed attempt:', error);
    }
  };

  const blockCreditCard = async (cardId: string): Promise<void> => {
    setLoading(true);
    
    try {
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      const cardIndex = existingCards.findIndex((c: CreditCard) => c.id === cardId);
      
      if (cardIndex === -1) throw new Error('Card not found');
      
      existingCards[cardIndex].isBlocked = true;
      localStorage.setItem(CREDIT_CARDS_STORAGE_KEY, JSON.stringify(existingCards));
      
      await getUserCreditCards();
      
      toast({
        title: "Card Blocked",
        description: "Credit card has been blocked successfully",
      });
    } catch (error: any) {
      toast({
        title: "Block Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const unblockCreditCard = async (cardId: string): Promise<void> => {
    setLoading(true);
    
    try {
      if (!user?.isAdmin) throw new Error('Only admin can unblock cards');
      
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      const cardIndex = existingCards.findIndex((c: CreditCard) => c.id === cardId);
      
      if (cardIndex === -1) throw new Error('Card not found');
      
      existingCards[cardIndex].isBlocked = false;
      existingCards[cardIndex].permanentlyBlocked = false;
      existingCards[cardIndex].failedAttempts = 0;
      existingCards[cardIndex].temporaryBlockUntil = undefined;
      localStorage.setItem(CREDIT_CARDS_STORAGE_KEY, JSON.stringify(existingCards));
      
      await getUserCreditCards();
      
      toast({
        title: "Card Unblocked",
        description: "Credit card has been unblocked successfully",
      });
    } catch (error: any) {
      toast({
        title: "Unblock Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateCreditCardValidity = async (cardId: string, additionalYears: number): Promise<void> => {
    setLoading(true);
    
    try {
      if (!user?.isAdmin) throw new Error('Only admin can update card validity');
      
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      const cardIndex = existingCards.findIndex((c: CreditCard) => c.id === cardId);
      
      if (cardIndex === -1) throw new Error('Card not found');
      
      const currentExpiry = new Date(existingCards[cardIndex].expiryDate);
      currentExpiry.setFullYear(currentExpiry.getFullYear() + additionalYears);
      
      existingCards[cardIndex].expiryDate = currentExpiry;
      existingCards[cardIndex].validityYears += additionalYears;
      localStorage.setItem(CREDIT_CARDS_STORAGE_KEY, JSON.stringify(existingCards));
      
      await getUserCreditCards();
      
      toast({
        title: "Card Validity Updated",
        description: `Card validity extended by ${additionalYears} years`,
      });
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getUserCreditCards = async (): Promise<void> => {
    if (!user) return;
    
    try {
      const existingCards = JSON.parse(localStorage.getItem(CREDIT_CARDS_STORAGE_KEY) || '[]');
      const userCards = existingCards
        .filter((card: CreditCard) => card.userId === user.id)
        .map((card: CreditCard) => ({
          ...card,
          createdAt: new Date(card.createdAt),
          expiryDate: new Date(card.expiryDate),
          temporaryBlockUntil: card.temporaryBlockUntil ? new Date(card.temporaryBlockUntil) : undefined,
          lastUsed: card.lastUsed ? new Date(card.lastUsed) : undefined
        }));
      
      setCreditCards(userCards);
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      setCreditCards([]);
    }
  };

  useEffect(() => {
    if (user) {
      getUserCreditCards();
    } else {
      setCreditCards([]);
    }
  }, [user]);

  // Listen for premium card approval events
  useEffect(() => {
    const handlePremiumCardApproved = (event: CustomEvent) => {
      const { userId } = event.detail;
      if (user && user.id === userId) {
        // Refresh user's credit cards when their premium application is approved
        getUserCreditCards();
        toast({
          title: "Premium Card Approved!",
          description: "Your premium credit card application has been approved. Your new premium card is now available.",
        });
      }
    };

    window.addEventListener('premiumCardApproved', handlePremiumCardApproved as EventListener);

    return () => {
      window.removeEventListener('premiumCardApproved', handlePremiumCardApproved as EventListener);
    };
  }, [user, getUserCreditCards]);

  return (
    <CreditCardContext.Provider value={{
      creditCards,
      loading,
      createCreditCard,
      validateCreditCard,
      blockCreditCard,
      unblockCreditCard,
      updateCreditCardValidity,
      getUserCreditCards,
      recordFailedAttempt
    }}>
      {children}
    </CreditCardContext.Provider>
  );
};

export const useCreditCard = () => {
  const context = useContext(CreditCardContext);
  if (context === undefined) {
    throw new Error('useCreditCard must be used within a CreditCardProvider');
  }
  return context;
};