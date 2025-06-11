import { Injectable } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmationDialogComponent } from '../../components/shared/confirmation-dialog/confirmation-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class ConfirmationService {
  constructor(private modalService: NgbModal) {}

  confirm(title: string, message: string): Promise<boolean> {
    const modalRef = this.modalService.open(ConfirmationDialogComponent, {
      centered: true,
      backdrop: 'static',
    });
    modalRef.componentInstance.title = title;
    modalRef.componentInstance.message = message;

    return modalRef.result.catch(() => false);
  }
}
