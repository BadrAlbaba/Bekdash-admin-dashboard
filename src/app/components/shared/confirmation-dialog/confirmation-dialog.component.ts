import { Component, Input } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-confirmation-dialog',
  imports: [TranslateModule],
  styleUrls: ['./confirmation-dialog.component.scss'],
  templateUrl: './confirmation-dialog.component.html',
})
export class ConfirmationDialogComponent {
  @Input() title = 'Confirm';
  @Input() message = 'Are you sure?';

  constructor(public activeModal: NgbActiveModal) {}
}
