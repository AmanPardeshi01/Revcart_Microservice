import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CartService } from '../../core/services/cart.service';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { PaymentService } from '../../core/services/payment.service';
import { NotificationService } from '../../core/services/notification.service';

import { environment } from '../../../environments/environment';
import { LucideAngularModule, CreditCard, MapPin } from 'lucide-angular';

interface AddressDto {
    id?: number;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    primaryAddress: boolean;
}

interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}

@Component({
    selector: 'app-checkout',
    standalone: true,
    imports: [CommonModule, FormsModule, LucideAngularModule],
    templateUrl: './checkout.component.html',
    styleUrls: ['./checkout.component.scss']
})
export class CheckoutComponent implements OnInit {
    cartService = inject(CartService);
    authService = inject(AuthService);
    router = inject(Router);
    http = inject(HttpClient);
    orderService = inject(OrderService);
    paymentService = inject(PaymentService);
    notificationService = inject(NotificationService);

    readonly CreditCard = CreditCard;
    readonly MapPin = MapPin;

    formData = signal({
        fullName: this.authService.user()?.name || '',
        phone: this.authService.user()?.phone || '',
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: 'India',
        paymentMethod: 'card'
    });

    isLoading = signal(false);
    errorMessage = signal('');
    addresses = signal<AddressDto[]>([]);
    selectedAddressId: number | 'new' = 'new';
    isSubmitting = signal(false);

    ngOnInit(): void {
        this.fetchSavedAddresses();
    }

    fetchSavedAddresses(): void {
        this.http.get<ApiResponse<AddressDto[]>>(`${environment.apiUrl}/profile/addresses`).subscribe({
            next: (res) => {
                if (res.success && Array.isArray(res.data)) {
                    this.addresses.set(res.data);
                    const primary = res.data.find((a) => a.primaryAddress && a.id);
                    const fallback = res.data.find((a) => !!a.id);
                    if (primary?.id) {
                        this.setSelectedAddress(primary.id);
                    } else if (fallback?.id) {
                        this.setSelectedAddress(fallback.id);
                    } else {
                        this.setSelectedAddress('new');
                    }
                } else {
                    this.setSelectedAddress('new');
                }
            },
            error: (err) => {
                console.error('Failed to fetch addresses', err);
                this.setSelectedAddress('new');
            }
        });
    }

    onAddressSelectionChange(addressId: number | 'new'): void {
        this.setSelectedAddress(addressId);
    }

    private setSelectedAddress(addressId: number | 'new'): void {
        this.selectedAddressId = addressId;
        const user = this.authService.user();
        const baseForm = {
            ...this.formData(),
            fullName: user?.name || '',
            phone: user?.phone || ''
        };

        if (addressId === 'new') {
            this.formData.set({
                ...baseForm,
                address: '',
                city: '',
                state: '',
                postalCode: '',
                country: 'India'
            });
            return;
        }

        const address = this.addresses().find((a) => a.id === addressId);
        if (address) {
            this.formData.set({
                ...baseForm,
                address: address.line1,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: address.country
            });
        }
    }

    get deliveryFee(): number {
        return this.cartService.total() > 0 ? 5.99 : 0;
    }

    get grandTotal(): number {
        return this.cartService.total() + this.deliveryFee;
    }

    onSubmit(): void {
        if (this.isSubmitting()) {
            return; // Prevent duplicate submissions
        }

        if (this.cartService.items().length === 0) {
            this.errorMessage.set('Your cart is empty');
            return;
        }

        // Validate only if adding new address
        if (this.selectedAddressId === 'new') {
            const data = this.formData();
            if (!data.address?.trim() || !data.city?.trim() || !data.postalCode?.trim() || !data.state?.trim()) {
                this.errorMessage.set('Please fill in all required address fields');
                return;
            }
        } else if (typeof this.selectedAddressId === 'number') {
            // Using existing address - no validation needed
            const selectedAddress = this.addresses().find(a => a.id === this.selectedAddressId);
            if (!selectedAddress) {
                this.errorMessage.set('Selected address not found. Please select a valid address.');
                return;
            }
        }

        this.isLoading.set(true);
        this.isSubmitting.set(true);
        this.errorMessage.set('');

        if (this.selectedAddressId === 'new') {
            // Create new address then place order
            this.createAddressAndPlaceOrder();
        } else {
            // Use existing address
            this.placeOrder(this.selectedAddressId as number);
        }
    }

    private createAddressAndPlaceOrder(): void {
        const data = this.formData();
        const addressData: AddressDto = {
            line1: data.address,
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: data.country || 'India',
            primaryAddress: true
        };

        this.http.post<ApiResponse<AddressDto>>(`${environment.apiUrl}/profile/addresses`, addressData)
            .subscribe({
                next: (response) => {
                    if (response.success && response.data?.id) {
                        this.placeOrder(response.data.id);
                    } else {
                        this.isLoading.set(false);
                        this.isSubmitting.set(false);
                        this.errorMessage.set('Failed to save address. Please try again.');
                    }
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.isSubmitting.set(false);
                    this.errorMessage.set(err.error?.message || 'Failed to save address. Please try again.');
                    console.error('Address creation failed:', err);
                }
            });
    }



    private placeOrder(addressId: number): void {
        const user = this.authService.user();
        if (!user || !user.id) {
            this.isLoading.set(false);
            this.errorMessage.set('User not authenticated. Please login again.');
            return;
        }

        const paymentMethodMap: { [key: string]: string } = {
            'card': 'RAZORPAY',
            'upi': 'UPI',
            'cod': 'COD'
        };

        const paymentMethod = paymentMethodMap[this.formData().paymentMethod] || 'COD';

        const checkoutRequest: any = {
            addressId: addressId,
            paymentMethod: paymentMethod
        };

        const headers = {
            'X-User-Id': user.id.toString()
        };

        this.http.post<ApiResponse<any>>(`${environment.apiUrl}/orders/checkout`, checkoutRequest, { headers })
            .subscribe({
                next: (response) => {
                    const order = response.data || response;
                    const orderId = order.id || order.orderId;
                    const orderAmount = order.totalAmount || this.grandTotal;

                    if (this.formData().paymentMethod === 'card') {
                        this.isLoading.set(false);
                        this.openRazorpay(orderId, orderAmount);
                    } else {
                        this.isLoading.set(false);
                        this.isSubmitting.set(false);
                        this.cartService.clearCart();
                        this.notificationService.success('Order Placed', 'Your order has been placed successfully!');
                        this.router.navigate(['/orders']);
                    }
                },
                error: (err) => {
                    this.isLoading.set(false);
                    this.isSubmitting.set(false);
                    console.error('Order creation failed:', err);
                    this.errorMessage.set(err.error?.message || 'Failed to place order. Please try again.');
                }
            });
    }

    openRazorpay(orderId: number, amount: number): void {
        const user = this.authService.user();
        if (!user) return;

        // Simulate Razorpay payment
        if (confirm(`Process payment of ₹${amount.toFixed(2)} for Order #${orderId}?`)) {
            this.paymentService.processDummyPayment(orderId, user.id!, amount, 'RAZORPAY')
                .subscribe({
                    next: (response) => {
                        if (response.success) {
                            this.cartService.clearCart();
                            this.isSubmitting.set(false);
                            this.notificationService.success('Payment Successful', 'Your order has been placed successfully!');
                            this.router.navigate(['/orders']);
                        } else {
                            this.errorMessage.set('Payment failed. Please try again.');
                            this.isSubmitting.set(false);
                        }
                    },
                    error: (err) => {
                        this.errorMessage.set('Payment processing failed');
                        this.isSubmitting.set(false);
                    }
                });
        } else {
            this.isSubmitting.set(false);
            this.errorMessage.set('Payment cancelled');
        }
    }
}
