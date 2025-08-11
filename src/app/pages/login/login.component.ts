import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { LoginService } from '../../services/login.service';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ButtonModule,
    InputTextModule,
    FormsModule,
    ToastModule
  ],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  providers: [MessageService]
})
export class LoginComponent {

  username: string = '';
  password: string = '';

  constructor(private router: Router, private loginService: LoginService, private messageService: MessageService ) {}

  login() {
    this.loginService.login(this.username, this.password).subscribe({
      next: (res) => {
        const rol = res?.usuario?.role;
        const userId = res?.usuario?.id;

        if (rol === 'admin' || rol === 'delivery') {
          console.log('Rol recibido:', rol);

          // Guardar el ID del usuario en localStorage
          if (userId) {
            localStorage.setItem('userId', userId.toString());
          }
          
          // También podrías guardar el rol si lo necesitas
          localStorage.setItem('userRole', rol);
          
          console.log('ID de usuario recibido:', userId);
          // Mostramos toast de éxito
          this.messageService.add({
            severity: 'success',
            summary: 'Éxito',
            detail: 'Inicio de sesión correcto'
          });
          
          setTimeout(() => {
            this.router.navigate([`/${rol}`]);
          }, 1500);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Rol no reconocido'
          });
        }
      },
      error: (err) => {
        console.error(err);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Error al iniciar sesión'
        });
      }
    });
  }

  navigateToAdmin() {
    this.router.navigate(['/admin']);
  }

  navigateToDelivery() {
    this.router.navigate(['/delivery']);
  }

}
