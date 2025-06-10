import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  ToastService,
  ToastMessage,
} from '../../../services/toast/toast.service';
import { Subscription, timer } from 'rxjs';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.component.html',
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastMessage | null = null;
  private sub!: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.sub = this.toastService.toast$.subscribe((msg) => {
      this.toast = msg;
      timer(3000).subscribe(() => (this.toast = null));
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
