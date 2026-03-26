import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatConversation, ChatMetric } from '../../mock/chatbot.mock';

@Component({
  selector: 'app-admin-chatbot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-chatbot.component.html',
  styleUrls: ['./admin-chatbot.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminChatbotComponent implements OnInit {
  metricas: ChatMetric[] = [];
  conversaciones: ChatConversation[] = [];

  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.chatbotService.getMetricas().subscribe((metricas) => {
      this.metricas = metricas;
      this.cdr.markForCheck();
    });
    this.chatbotService.getConversaciones().subscribe((conversaciones) => {
      this.conversaciones = conversaciones;
      this.cdr.markForCheck();
    });
  }
}
