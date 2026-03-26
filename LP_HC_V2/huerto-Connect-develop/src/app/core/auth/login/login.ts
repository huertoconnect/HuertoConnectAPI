import { CUSTOM_ELEMENTS_SCHEMA, AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Router, RouterModule } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { take } from 'rxjs/operators';
import { getDashboardRouteByRole } from '../auth-role.utils';
import { AuthService, AuthSession, SendOtpResponse, UserRole } from '../services/auth.service';
import {
  evaluatePasswordStrength,
  sanitizeEmail,
  sanitizePassword,
  sanitizePlainText,
  validateEmailValue,
  validateNameValue,
  validatePasswordValue
} from '../../../shared/validators';
import { environment } from '../../../../environments/environment';

interface SproutParticle {
  x: number;
  y: number;
  size: number;
  delay: number;
  duration: number;
  driftX: number;
  driftY: number;
  opacity: number;
  rotate: number;
}

type LoginFieldKey =
  | 'loginEmail'
  | 'loginPassword'
  | 'forgotEmail'
  | 'forgotNewPassword'
  | 'forgotConfirmPassword'
  | 'registerName'
  | 'registerApellidos'
  | 'registerEmail'
  | 'registerPassword'
  | 'registerConfirmPassword';

type PasswordFieldKey =
  | 'loginPassword'
  | 'forgotNewPassword'
  | 'forgotConfirmPassword'
  | 'registerPassword'
  | 'registerConfirmPassword';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class LoginComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService
  ) {
    const params = this.route.snapshot.queryParamMap;
    const isMagicResetFlow = this.isMagicResetFlow(params);
    const hasAuthReason = (params.get('reason') ?? '').trim().length > 0;
    if (this.authService.isAuthenticated() && !isMagicResetFlow && !hasAuthReason) {
      this.redirectToDashboard(this.authService.getUserRole(), true);
    }
  }

  isRegister = false;

  // Login Data
  loginEmail = '';
  loginPassword = '';
  otpCode = '';
  readonly codeIndexes = [0, 1, 2, 3, 4, 5];
  codeDigits = ['', '', '', '', '', ''];

  authStep: 'credentials' | 'otp' | 'forgot-email' | 'forgot-otp' | 'forgot-reset' = 'credentials';
  otpChallengeId = '';
  maskedLoginEmail = '';
  otpCountdownText = '05:00';
  canResendOtp = false;
  loginInfoMessage = '';

  forgotEmail = '';
  forgotChallengeId = '';
  forgotMaskedEmail = '';
  forgotOtpCode = '';
  forgotCodeDigits = ['', '', '', '', '', ''];
  forgotResetToken = '';
  forgotOtpCountdownText = '05:00';
  canResendForgotOtp = false;
  forgotNewPassword = '';
  forgotConfirmPassword = '';

  isSubmittingLogin = false;
  isVerifyingOtp = false;
  isResendingOtp = false;
  isSubmittingForgotRequest = false;
  isVerifyingForgotOtp = false;
  isResendingForgotOtp = false;
  isSubmittingPasswordReset = false;

  loginErrorMessage = '';
  otpErrorMessage = '';
  otpInfoMessage = '';
  forgotErrorMessage = '';
  forgotInfoMessage = '';

  // Register Data
  registerName = '';
  registerApellidos = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirmPassword = '';

  registerStep: 'form' | 'otp' = 'form';
  registerChallengeId = '';
  maskedRegisterEmail = '';
  regOtpCountdownText = '05:00';
  canResendRegisterOtp = false;

  isSubmittingRegister = false;
  isVerifyingRegisterOtp = false;
  isResendingRegisterOtp = false;

  registerErrorMessage = '';
  regOtpErrorMessage = '';
  regOtpInfoMessage = '';

  regCodeDigits = ['', '', '', '', '', ''];
  private regOtpCode = '';

  showLoginPassword = false;
  showForgotNewPassword = false;
  showForgotConfirmPassword = false;
  showRegisterPassword = false;
  showRegisterConfirmPassword = false;

  // Google Auth
  isGoogleLoading = false;
  googleErrorMessage = '';

  passwordStrength: { percent: number; level: 'weak' | 'medium' | 'strong'; label: string } = {
    percent: 0,
    level: 'weak',
    label: ''
  };

  private readonly optionalFields: LoginFieldKey[] = ['registerApellidos'];
  private readonly fieldTouchedState: Record<LoginFieldKey, boolean> = {
    loginEmail: false,
    loginPassword: false,
    forgotEmail: false,
    forgotNewPassword: false,
    forgotConfirmPassword: false,
    registerName: false,
    registerApellidos: false,
    registerEmail: false,
    registerPassword: false,
    registerConfirmPassword: false
  };

  private readonly maxFailedLoginAttempts = 4;
  private readonly loginLockDurationMs = 5 * 60 * 1000;
  private failedLoginAttempts = 0;
  private loginLockedUntilMs = 0;

  windXPx = 0;
  windYPx = 0;
  private targetWindXPx = 0;
  private targetWindYPx = 0;
  private windFrame: number | null = null;
  private otpExpiresAtMs = 0;
  private otpCountdownFrame: number | null = null;
  private forgotOtpExpiresAtMs = 0;
  private forgotOtpCountdownFrame: number | null = null;
  private regOtpExpiresAtMs = 0;
  private regOtpCountdownFrame: number | null = null;

  sprouts: SproutParticle[] = this.createSprouts(90);

  // ── Google Sign-In containers ──────────────────────────────────
  @ViewChild('googleBtnLogin')    private googleBtnLogin!:    ElementRef<HTMLDivElement>;
  @ViewChild('googleBtnRegister') private googleBtnRegister!: ElementRef<HTMLDivElement>;
  /** Evita reinicializar GIS si el componente permanece activo. */
  private _googleInitialized = false;

  ngOnInit() {
    this.consumeAuthReasonParams();
    this.consumeEmailLinkParams();
  }

  ngAfterViewInit(): void {
    // setTimeout(0) cede el hilo al motor de layout antes de renderizar GIS.
    setTimeout(() => this._initGoogle(), 0);
  }

  private isMagicResetFlow(params: ParamMap): boolean {
    return (
      params.get('source') === 'email-link' &&
      (params.get('magicLinkStatus') ?? '').trim().toLowerCase() === 'ok' &&
      (params.get('flow') ?? '').trim().toLowerCase() === 'forgot-reset' &&
      this.normalizeMagicLinkToken(params.get('resetToken')).length > 0
    );
  }

  private consumeEmailLinkParams() {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('source') !== 'email-link') {
      return;
    }

    const status = (params.get('magicLinkStatus') ?? '').trim().toLowerCase();
    const flow = (params.get('flow') ?? '').trim().toLowerCase();

    if (status !== 'ok') {
      this.applyEmailLinkErrorState(params);
      this.clearEmailLinkQueryParams();
      return;
    }

    if (flow === 'forgot-reset') {
      this.applyEmailLinkResetState(params);
      this.clearEmailLinkQueryParams();
      return;
    }

    if (flow === 'magic-login') {
      this.applyEmailLinkLoginSession(params);
      return;
    }

    this.clearEmailLinkQueryParams();
  }

  private consumeAuthReasonParams() {
    const params = this.route.snapshot.queryParamMap;
    if (params.get('source') === 'email-link') {
      return;
    }

    const reason = (params.get('reason') ?? '').trim().toLowerCase();
    if (!reason) {
      return;
    }

    this.isRegister = false;
    this.authStep = 'credentials';
    this.loginErrorMessage = '';

    if (reason === 'session_expired') {
      this.loginInfoMessage = 'Tu sesión expiró. Inicia sesión nuevamente para continuar.';
    } else if (reason === 'access_denied') {
      this.loginInfoMessage = 'No tienes permisos para acceder con esta sesión.';
    } else {
      this.loginInfoMessage = 'Inicia sesión para continuar.';
    }

    this.clearAuthReasonQueryParam();
  }

  toggleMode() {
    this.isRegister = !this.isRegister;
    this.resetPasswordVisibility();
    this.loginErrorMessage = '';
    this.registerErrorMessage = '';
    this.googleErrorMessage = '';
    if (this.isRegister) {
      this.resetFieldTouchedState(['registerName', 'registerApellidos', 'registerEmail', 'registerPassword', 'registerConfirmPassword']);
      return;
    }

    this.resetFieldTouchedState(['loginEmail', 'loginPassword']);
  }

  // ────────────────────────────────────────────────────────────────
  // Google Sign-In — Google Identity Services (GIS) oficial
  // ────────────────────────────────────────────────────────────────

  /**
   * Inicializa GIS, renderiza los botones oficiales de Google en ambos
   * formularios y lanza One Tap como canal paralelo.
   * Se ejecuta una sola vez desde ngAfterViewInit.
   */
  private _initGoogle(): void {
    if (this._googleInitialized) { return; }

    const googleApi = (window as any)['google'];
    if (!googleApi?.accounts?.id) {
      // La librería GIS aún no está lista; reintentar en 800 ms.
      setTimeout(() => this._initGoogle(), 800);
      return;
    }

    this._googleInitialized = true;

    // 1. Configurar client_id y callback (único punto de configuración).
    googleApi.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (res: any) => this._handleGoogleCredential(res),
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // 2. Botón oficial en el contenedor del formulario Login.
    //    Sin 'width': el CSS (.google-btn-container max-width: 320px) controla el tamaño.
    if (this.googleBtnLogin?.nativeElement) {
      googleApi.accounts.id.renderButton(this.googleBtnLogin.nativeElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        locale: 'es',
      });
    }

    // 3. Botón oficial en el contenedor del formulario Registro.
    if (this.googleBtnRegister?.nativeElement) {
      googleApi.accounts.id.renderButton(this.googleBtnRegister.nativeElement, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signup_with',
        locale: 'es',
      });
    }

    // 4. Intentar One Tap en segundo plano.
    //    Si el browser lo bloquea, el usuario usa el botón renderizado.
    googleApi.accounts.id.prompt();
  }

  /**
   * Callback compartido para One Tap y el botón renderizado.
   * Envía el Google ID Token al backend y gestiona la sesión JWT.
   */
  private _handleGoogleCredential(response: any): void {
    if (!response?.credential) {
      this.googleErrorMessage = 'No se recibió respuesta de Google. Inténtalo de nuevo.';
      return;
    }

    this.googleErrorMessage = '';
    this.isGoogleLoading = true;

    this.authService.googleAuth(response.credential).subscribe({
      next: (result) => {
        this.isGoogleLoading = false;
        if (result.session) {
          this.syncCurrentUserAndRedirect(result.session.user.role);
        }
      },
      error: (error: unknown) => {
        this.isGoogleLoading = false;
        this.googleErrorMessage = this._extractApiMessage(
          error,
          'No fue posible autenticar con Google.'
        );
      }
    });
  }

  /**
   * Extrae el mensaje de error respetando el formato del JWT interceptor.
   * Prioridad: apiMessage (del interceptor) > detail (FastAPI) > message > fallback.
   */
  private _extractApiMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== 'object') { return fallback; }
    const e = error as Record<string, any>;
    return e['apiMessage'] ?? e['error']?.['detail'] ?? e['error']?.['message'] ?? fallback;
  }


  onPointerMove(event: PointerEvent) {
    const target = event.currentTarget as HTMLElement;
    if (!target) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const xPct = ((event.clientX - rect.left) / rect.width) * 100;
    const yPct = ((event.clientY - rect.top) / rect.height) * 100;
    const centeredX = (Math.max(0, Math.min(100, xPct)) - 50) / 50;
    const centeredY = (Math.max(0, Math.min(100, yPct)) - 50) / 50;
    this.targetWindXPx = centeredX * 5;
    this.targetWindYPx = centeredY * 3;
    this.startWindLoop();
  }

  onPointerLeave() {
    this.targetWindXPx = 0;
    this.targetWindYPx = 0;
    this.startWindLoop();
  }

  onFieldBlur(field: LoginFieldKey) {
    this.fieldTouchedState[field] = true;
  }

  onPasswordToggleMouseDown(event: MouseEvent) {
    // Keep focus on the input to avoid blur-triggered layout jumps.
    event.preventDefault();
  }

  onPasswordToggleClick(event: MouseEvent, field: PasswordFieldKey) {
    event.preventDefault();
    event.stopPropagation();
    this.togglePasswordVisibility(field);
  }

  togglePasswordVisibility(field: PasswordFieldKey) {
    switch (field) {
      case 'loginPassword':
        this.showLoginPassword = !this.showLoginPassword;
        break;
      case 'forgotNewPassword':
        this.showForgotNewPassword = !this.showForgotNewPassword;
        break;
      case 'forgotConfirmPassword':
        this.showForgotConfirmPassword = !this.showForgotConfirmPassword;
        break;
      case 'registerPassword':
        this.showRegisterPassword = !this.showRegisterPassword;
        break;
      case 'registerConfirmPassword':
        this.showRegisterConfirmPassword = !this.showRegisterConfirmPassword;
        break;
    }
  }

  getPasswordToggleIcon(field: PasswordFieldKey): string {
    const isVisible = this.isPasswordVisible(field);
    return isVisible ? 'eye-outline' : 'eye-off-outline';
  }

  getPasswordInputType(field: PasswordFieldKey): 'text' | 'password' {
    return this.isPasswordVisible(field) ? 'text' : 'password';
  }

  onLoginEmailChange(value: string) {
    this.loginEmail = sanitizeEmail(value);
  }

  onLoginPasswordChange(value: string) {
    this.loginPassword = sanitizePassword(value);
  }

  onForgotEmailChange(value: string) {
    this.forgotEmail = sanitizeEmail(value);
  }

  onForgotNewPasswordChange(value: string) {
    this.forgotNewPassword = sanitizePassword(value);
  }

  onForgotConfirmPasswordChange(value: string) {
    this.forgotConfirmPassword = sanitizePassword(value);
  }

  onRegisterNameChange(value: string) {
    this.registerName = sanitizePlainText(value, {
      trim: false,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 50
    });
  }

  onRegisterApellidosChange(value: string) {
    this.registerApellidos = sanitizePlainText(value, {
      trim: false,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 50
    });
  }

  onRegisterEmailChange(value: string) {
    this.registerEmail = sanitizeEmail(value);
  }

  onRegisterPasswordChange(value: string) {
    this.registerPassword = sanitizePassword(value);
    this.passwordStrength = evaluatePasswordStrength(this.registerPassword);
  }

  onRegisterConfirmPasswordChange(value: string) {
    this.registerConfirmPassword = sanitizePassword(value);
  }

  getFieldError(field: LoginFieldKey): string | null {
    if (!this.fieldTouchedState[field]) {
      return null;
    }

    const errors = this.getFieldErrors(field);
    return errors[0] ?? null;
  }

  isFieldInvalid(field: LoginFieldKey): boolean {
    return this.fieldTouchedState[field] && this.getFieldErrors(field).length > 0;
  }

  isFieldValid(field: LoginFieldKey): boolean {
    if (!this.fieldTouchedState[field]) {
      return false;
    }

    if (this.getFieldErrors(field).length > 0) {
      return false;
    }

    if (this.optionalFields.includes(field)) {
      return this.getFieldValue(field).length > 0;
    }

    return true;
  }

  isCredentialsFormValid(): boolean {
    return this.getFieldErrors('loginEmail').length === 0 && this.getFieldErrors('loginPassword').length === 0;
  }

  isLoginTemporarilyRestricted(): boolean {
    return this.getLoginSecurityMessage() !== null;
  }

  isForgotEmailFormValid(): boolean {
    return this.getFieldErrors('forgotEmail').length === 0;
  }

  isForgotResetFormValid(): boolean {
    return (
      this.getFieldErrors('forgotNewPassword').length === 0 &&
      this.getFieldErrors('forgotConfirmPassword').length === 0
    );
  }

  isRegisterFormValid(): boolean {
    return (
      this.getFieldErrors('registerName').length === 0 &&
      this.getFieldErrors('registerApellidos').length === 0 &&
      this.getFieldErrors('registerEmail').length === 0 &&
      this.getFieldErrors('registerPassword').length === 0 &&
      this.getFieldErrors('registerConfirmPassword').length === 0
    );
  }

  onAuthSubmit() {
    if (this.authStep === 'credentials') {
      this.onLogin();
      return;
    }

    if (this.authStep === 'otp') {
      this.onVerifyOtp();
      return;
    }

    if (this.authStep === 'forgot-email') {
      this.onRequestPasswordResetOtp();
      return;
    }

    if (this.authStep === 'forgot-otp') {
      this.onVerifyForgotOtp();
      return;
    }

    this.onSubmitNewPassword();
  }

  onLogin() {
    if (this.authStep !== 'credentials' || this.isSubmittingLogin) {
      return;
    }

    this.markFieldsAsTouched(['loginEmail', 'loginPassword']);
    this.loginEmail = sanitizeEmail(this.loginEmail);
    this.loginPassword = sanitizePassword(this.loginPassword);

    const email = this.loginEmail;
    const password = this.loginPassword;

    this.loginErrorMessage = '';
    this.loginInfoMessage = '';
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';

    if (!this.isCredentialsFormValid()) {
      this.loginErrorMessage = this.getCredentialsValidationError();
      return;
    }

    const loginSecurityMessage = this.getLoginSecurityMessage();
    if (loginSecurityMessage) {
      this.loginErrorMessage = loginSecurityMessage;
      return;
    }

    this.enterOtpStepPending(email);
    this.isSubmittingLogin = true;
    this.authService.requestOtp({ email, password }).subscribe({
      next: (response) => {
        this.isSubmittingLogin = false;
        this.configureOtpStep(response);
      },
      error: (error: unknown) => {
        this.isSubmittingLogin = false;
        this.authStep = 'credentials';
        this.otpChallengeId = '';
        this.otpCode = '';
        this.canResendOtp = false;
        this.stopOtpTimer();
        this.registerFailedLoginAttempt();
        const backendError = this.extractErrorMessage(error, 'No fue posible iniciar sesion.');
        this.loginErrorMessage = this.composeLoginError(backendError);
      }
    });
  }

  onStartForgotPassword() {
    this.resetForgotPasswordFlow();
    this.authStep = 'forgot-email';
    this.forgotEmail = sanitizeEmail(this.loginEmail);
    this.loginErrorMessage = '';
    this.loginInfoMessage = '';
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';
    this.fieldTouchedState.forgotEmail = false;
  }

  onRequestPasswordResetOtp() {
    if (this.authStep !== 'forgot-email' || this.isSubmittingForgotRequest) {
      return;
    }

    this.markFieldsAsTouched(['forgotEmail']);
    this.forgotEmail = sanitizeEmail(this.forgotEmail);
    const email = this.forgotEmail;
    this.forgotChallengeId = '';
    this.forgotResetToken = '';
    this.canResendForgotOtp = false;
    this.stopForgotOtpTimer();
    this.setForgotCodeDigits('');
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';

    if (!this.isForgotEmailFormValid()) {
      this.forgotErrorMessage = this.getFieldErrors('forgotEmail')[0] ?? 'Ingresa tu correo para continuar.';
      return;
    }

    this.enterForgotOtpStepPending(email);
    this.isSubmittingForgotRequest = true;
    this.authService.forgotPassword({ email }).subscribe({
      next: (response) => {
        this.isSubmittingForgotRequest = false;
        this.forgotEmail = email;
        this.forgotMaskedEmail = response.maskedEmail || this.maskEmailForDisplay(email);

        if (!response.challengeId) {
          this.forgotChallengeId = '';
          this.setForgotCodeDigits('');
          this.stopForgotOtpTimer();
          this.forgotInfoMessage = response.message;
          return;
        }

        this.authStep = 'forgot-otp';
        this.forgotChallengeId = response.challengeId;
        this.setForgotCodeDigits(response.devOtpCode ?? '');
        this.forgotInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Ingresa el código que enviamos a tu correo para cambiar tu contraseña.'
        );
        this.canResendForgotOtp = false;
        this.configureForgotOtpTimer(response.expiresAt);
      },
      error: (error: unknown) => {
        this.isSubmittingForgotRequest = false;
        this.forgotErrorMessage = this.extractErrorMessage(
          error,
          'No fue posible iniciar la recuperacion de contraseña.'
        );
        this.authStep = 'forgot-email';
      }
    });
  }

  onVerifyForgotOtp() {
    if (this.authStep !== 'forgot-otp' || this.isVerifyingForgotOtp) {
      return;
    }

    if (!this.forgotChallengeId) {
      this.forgotInfoMessage = 'Estamos enviando tu código. Espera unos segundos.';
      return;
    }

    this.syncForgotOtpCodeFromDigits();
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';

    if (this.forgotOtpCode.length !== 6) {
      this.forgotErrorMessage = 'Ingresa el código de 6 dígitos.';
      return;
    }

    this.isVerifyingForgotOtp = true;
    this.authService
      .verifyOtp({
        challengeId: this.forgotChallengeId,
        otpCode: this.forgotOtpCode
      })
      .subscribe({
        next: (response) => {
          this.isVerifyingForgotOtp = false;

          if (!response.resetToken) {
            this.forgotErrorMessage = 'No fue posible validar el código. Solicita uno nuevo.';
            this.canResendForgotOtp = true;
            return;
          }

          this.forgotResetToken = response.resetToken;
          this.forgotNewPassword = '';
          this.forgotConfirmPassword = '';
          this.authStep = 'forgot-reset';
          this.forgotInfoMessage = 'Código verificado. Define tu nueva contraseña.';
          this.stopForgotOtpTimer();
        },
        error: (error: unknown) => {
          this.isVerifyingForgotOtp = false;
          this.canResendForgotOtp = true;
          this.forgotErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible verificar el código.'
          );
        }
      });
  }

  onSubmitNewPassword() {
    if (this.authStep !== 'forgot-reset' || this.isSubmittingPasswordReset) {
      return;
    }

    this.markFieldsAsTouched(['forgotNewPassword', 'forgotConfirmPassword']);
    this.forgotNewPassword = sanitizePassword(this.forgotNewPassword);
    this.forgotConfirmPassword = sanitizePassword(this.forgotConfirmPassword);

    const newPassword = this.forgotNewPassword;

    this.forgotErrorMessage = '';

    if (!this.forgotResetToken) {
      this.forgotErrorMessage = 'El proceso de recuperación expiró. Solicita un nuevo código.';
      return;
    }

    if (!this.isForgotResetFormValid()) {
      this.forgotErrorMessage =
        this.getFieldErrors('forgotNewPassword')[0] ??
        this.getFieldErrors('forgotConfirmPassword')[0] ??
        'Revisa los datos de contraseña.';
      return;
    }

    this.isSubmittingPasswordReset = true;
    this.authService.resetPassword({ resetToken: this.forgotResetToken, newPassword }).subscribe({
      next: (response) => {
        this.isSubmittingPasswordReset = false;
        const recoveredEmail = this.forgotEmail.trim().toLowerCase();
        this.resetForgotPasswordFlow();
        this.authStep = 'credentials';
        this.loginEmail = recoveredEmail;
        this.loginPassword = '';
        this.loginErrorMessage = '';
        this.loginInfoMessage = response.message;
      },
      error: (error: unknown) => {
        this.isSubmittingPasswordReset = false;
        this.forgotErrorMessage = this.extractErrorMessage(
          error,
          'No fue posible actualizar la contraseña.'
        );
      }
    });
  }

  onResendForgotOtp() {
    if (!this.forgotChallengeId || !this.canResendForgotOtp || this.isResendingForgotOtp) {
      return;
    }

    this.isResendingForgotOtp = true;
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';

    this.authService.resendOtp({ challengeId: this.forgotChallengeId }).subscribe({
      next: (response) => {
        this.isResendingForgotOtp = false;
        this.canResendForgotOtp = false;
        this.setForgotCodeDigits(response.devOtpCode ?? '');
        this.forgotMaskedEmail = response.maskedEmail;
        this.configureForgotOtpTimer(response.expiresAt);
        this.forgotInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Te enviamos un nuevo código para recuperar tu cuenta.'
        );
      },
      error: (error: unknown) => {
        this.isResendingForgotOtp = false;
        this.forgotErrorMessage = this.extractErrorMessage(error, 'No fue posible reenviar el código.');
      }
    });
  }

  onBackToForgotEmail() {
    this.authStep = 'forgot-email';
    this.forgotChallengeId = '';
    this.forgotResetToken = '';
    this.canResendForgotOtp = false;
    this.setForgotCodeDigits('');
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';
    this.stopForgotOtpTimer();
  }

  onCancelForgotPassword() {
    this.authStep = 'credentials';
    this.resetForgotPasswordFlow();
  }

  onForgotCodeDigitInput(index: number, value: string) {
    if (!this.forgotChallengeId) {
      return;
    }

    const normalized = value.replace(/\D/g, '').slice(-1);
    this.forgotCodeDigits[index] = normalized;
    this.syncForgotOtpCodeFromDigits();

    if (normalized && index < this.forgotCodeDigits.length - 1) {
      this.focusForgotCodeDigit(index + 1);
    }
  }

  onForgotCodeDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.forgotCodeDigits[index] && index > 0) {
      this.focusForgotCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusForgotCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.forgotCodeDigits.length - 1) {
      event.preventDefault();
      this.focusForgotCodeDigit(index + 1);
    }
  }

  onForgotCodeDigitsPaste(event: ClipboardEvent) {
    if (!this.forgotChallengeId) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, this.forgotCodeDigits.length);
    this.setForgotCodeDigits(normalized);

    const nextIndex = Math.min(normalized.length, this.forgotCodeDigits.length - 1);
    this.focusForgotCodeDigit(nextIndex);
  }

  onRegister() {
    if (this.registerStep !== 'form' || this.isSubmittingRegister) {
      return;
    }

    this.markFieldsAsTouched([
      'registerName',
      'registerApellidos',
      'registerEmail',
      'registerPassword',
      'registerConfirmPassword'
    ]);

    this.registerName = sanitizePlainText(this.registerName, {
      trim: true,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 50
    });
    this.registerApellidos = sanitizePlainText(this.registerApellidos, {
      trim: true,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 50
    });
    this.registerEmail = sanitizeEmail(this.registerEmail);
    this.registerPassword = sanitizePassword(this.registerPassword);
    this.registerConfirmPassword = sanitizePassword(this.registerConfirmPassword);

    const nombre = this.registerName;
    const apellidos = this.registerApellidos;
    const email = this.registerEmail;
    const password = this.registerPassword;

    this.registerErrorMessage = '';

    if (!this.isRegisterFormValid()) {
      this.registerErrorMessage = this.getRegisterValidationError();
      return;
    }

    this.isSubmittingRegister = true;
    this.registerStep = 'otp';
    this.maskedRegisterEmail = this.maskEmailForDisplay(email);
    this.setRegCodeDigits('');
    this.regOtpInfoMessage = 'Enviando código de verificación...';
    this.regOtpErrorMessage = '';

    this.authService.register({ nombre, apellidos, email, password }).subscribe({
      next: (response) => {
        this.isSubmittingRegister = false;
        this.registerChallengeId = response.challengeId;
        this.maskedRegisterEmail = response.maskedEmail;
        this.setRegCodeDigits(response.devOtpCode ?? '');
        this.regOtpInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Ingresa el código que enviamos a tu correo para activar tu cuenta.'
        );
        this.canResendRegisterOtp = false;
        this.configureRegOtpTimer(response.expiresAt);
      },
      error: (error: unknown) => {
        this.isSubmittingRegister = false;
        this.registerStep = 'form';
        this.registerChallengeId = '';
        this.regOtpInfoMessage = '';
        this.registerErrorMessage = this.extractErrorMessage(error, 'No fue posible crear la cuenta.');
      }
    });
  }

  onVerifyRegisterOtp() {
    if (this.registerStep !== 'otp' || this.isVerifyingRegisterOtp) {
      return;
    }

    if (!this.registerChallengeId) {
      this.regOtpInfoMessage = 'Estamos enviando tu código. Espera unos segundos.';
      return;
    }

    this.syncRegOtpCodeFromDigits();
    this.regOtpErrorMessage = '';
    this.regOtpInfoMessage = '';

    if (this.regOtpCode.length !== 6) {
      this.regOtpErrorMessage = 'Ingresa el código de 6 dígitos.';
      return;
    }

    this.isVerifyingRegisterOtp = true;
    this.authService
      .verifyOtp({
        challengeId: this.registerChallengeId,
        otpCode: this.regOtpCode
      })
      .subscribe({
        next: (response) => {
          if (!response.session) {
            this.isVerifyingRegisterOtp = false;
            this.regOtpErrorMessage = 'No fue posible crear la sesion. Intenta nuevamente.';
            return;
          }

          this.isVerifyingRegisterOtp = false;
          this.stopRegOtpTimer();
          this.registerPassword = '';
          this.registerConfirmPassword = '';
          this.setRegCodeDigits('');
          this.syncCurrentUserAndRedirect(response.session.user.role);
        },
        error: (error: unknown) => {
          this.isVerifyingRegisterOtp = false;
          this.canResendRegisterOtp = true;
          this.regOtpErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible verificar el código.'
          );
        }
      });
  }

  onResendRegisterOtp() {
    if (!this.registerChallengeId || !this.canResendRegisterOtp || this.isResendingRegisterOtp) {
      return;
    }

    this.isResendingRegisterOtp = true;
    this.regOtpErrorMessage = '';
    this.regOtpInfoMessage = '';

    this.authService.resendOtp({ challengeId: this.registerChallengeId }).subscribe({
      next: (response) => {
        this.isResendingRegisterOtp = false;
        this.canResendRegisterOtp = false;
        this.setRegCodeDigits(response.devOtpCode ?? '');
        this.maskedRegisterEmail = response.maskedEmail;
        this.configureRegOtpTimer(response.expiresAt);
        this.regOtpInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Te enviamos un nuevo código a tu correo.'
        );
      },
      error: (error: unknown) => {
        this.isResendingRegisterOtp = false;
        this.regOtpErrorMessage = this.extractErrorMessage(error, 'No fue posible reenviar el código.');
      }
    });
  }

  onBackToRegisterForm() {
    this.registerStep = 'form';
    this.registerChallengeId = '';
    this.setRegCodeDigits('');
    this.regOtpInfoMessage = '';
    this.regOtpErrorMessage = '';
    this.canResendRegisterOtp = false;
    this.stopRegOtpTimer();
    this.showRegisterPassword = false;
    this.showRegisterConfirmPassword = false;
  }

  onRegCodeDigitInput(index: number, value: string) {
    if (!this.registerChallengeId) {
      return;
    }

    const normalized = value.replace(/\D/g, '').slice(-1);
    this.regCodeDigits[index] = normalized;
    this.syncRegOtpCodeFromDigits();

    if (normalized && index < this.regCodeDigits.length - 1) {
      this.focusRegCodeDigit(index + 1);
    }
  }

  onRegCodeDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.regCodeDigits[index] && index > 0) {
      this.focusRegCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusRegCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.regCodeDigits.length - 1) {
      event.preventDefault();
      this.focusRegCodeDigit(index + 1);
    }
  }

  onRegCodeDigitsPaste(event: ClipboardEvent) {
    if (!this.registerChallengeId) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, this.regCodeDigits.length);
    this.setRegCodeDigits(normalized);

    const nextIndex = Math.min(normalized.length, this.regCodeDigits.length - 1);
    this.focusRegCodeDigit(nextIndex);
  }

  onVerifyOtp() {
    if (this.authStep !== 'otp' || this.isVerifyingOtp) {
      return;
    }

    if (!this.otpChallengeId) {
      this.otpInfoMessage = 'Estamos enviando tu codigo. Espera unos segundos.';
      return;
    }

    this.syncOtpCodeFromDigits();
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';

    if (this.otpCode.length !== 6) {
      this.otpErrorMessage = 'Ingresa el codigo de 6 digitos.';
      return;
    }

    this.isVerifyingOtp = true;
    this.authService
      .verifyOtp({
        challengeId: this.otpChallengeId,
        otpCode: this.otpCode
      })
      .subscribe({
        next: (response) => {
          if (!response.session) {
            this.isVerifyingOtp = false;
            this.otpErrorMessage = 'No fue posible crear la sesion. Solicita un nuevo codigo.';
            this.canResendOtp = true;
            return;
          }

          this.isVerifyingOtp = false;
          this.stopOtpTimer();
          this.loginPassword = '';
          this.setCodeDigits('');
          this.syncCurrentUserAndRedirect(response.session.user.role);
        },
        error: (error: unknown) => {
          this.isVerifyingOtp = false;
          this.canResendOtp = true;
          this.otpErrorMessage = this.extractErrorMessage(
            error,
            'No fue posible verificar el codigo.'
          );
        }
      });
  }

  onResendOtp() {
    if (!this.otpChallengeId || !this.canResendOtp || this.isResendingOtp) {
      return;
    }

    this.isResendingOtp = true;
    this.otpErrorMessage = '';
    this.otpInfoMessage = '';

    this.authService.resendOtp({ challengeId: this.otpChallengeId }).subscribe({
      next: (response) => {
        this.isResendingOtp = false;
        this.canResendOtp = false;
        this.setCodeDigits(response.devOtpCode ?? '');
        this.maskedLoginEmail = response.maskedEmail;
        this.configureOtpTimer(response.expiresAt);
        this.otpInfoMessage = this.buildOtpInfoMessage(
          response.devOtpCode,
          'Te enviamos un nuevo codigo a tu correo.'
        );
      },
      error: (error: unknown) => {
        this.isResendingOtp = false;
        this.otpErrorMessage = this.extractErrorMessage(error, 'No fue posible reenviar el codigo.');
      }
    });
  }

  onCodeDigitInput(index: number, value: string) {
    if (this.isSubmittingLogin || !this.otpChallengeId) {
      return;
    }

    const normalized = value.replace(/\D/g, '').slice(-1);
    this.codeDigits[index] = normalized;
    this.syncOtpCodeFromDigits();

    if (normalized && index < this.codeDigits.length - 1) {
      this.focusCodeDigit(index + 1);
    }
  }

  onCodeDigitKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !this.codeDigits[index] && index > 0) {
      this.focusCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusCodeDigit(index - 1);
      return;
    }

    if (event.key === 'ArrowRight' && index < this.codeDigits.length - 1) {
      event.preventDefault();
      this.focusCodeDigit(index + 1);
    }
  }

  onCodeDigitsPaste(event: ClipboardEvent) {
    if (this.isSubmittingLogin || !this.otpChallengeId) {
      return;
    }

    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    const normalized = pasted.replace(/\D/g, '').slice(0, this.codeDigits.length);
    this.setCodeDigits(normalized);

    const nextIndex = Math.min(normalized.length, this.codeDigits.length - 1);
    this.focusCodeDigit(nextIndex);
  }

  onBackToCredentials() {
    this.authStep = 'credentials';
    this.otpChallengeId = '';
    this.setCodeDigits('');
    this.otpInfoMessage = '';
    this.otpErrorMessage = '';
    this.canResendOtp = false;
    this.stopOtpTimer();
    this.showLoginPassword = false;
  }

  ngOnDestroy() {
    if (this.windFrame !== null) {
      cancelAnimationFrame(this.windFrame);
    }

    this.stopOtpTimer();
    this.stopForgotOtpTimer();
    this.stopRegOtpTimer();

    // Cancelar One Tap al salir de la página de login.
    const googleApi = (window as any)['google'];
    googleApi?.accounts?.id?.cancel?.();
  }

  private applyEmailLinkResetState(params: ParamMap) {
    const resetToken = this.normalizeMagicLinkToken(params.get('resetToken'));
    if (!resetToken) {
      this.authStep = 'credentials';
      this.loginErrorMessage = 'El enlace de recuperación expiró o es inválido. Solicita uno nuevo.';
      return;
    }

    this.resetForgotPasswordFlow();
    this.isRegister = false;
    this.authStep = 'forgot-reset';
    this.forgotResetToken = resetToken;
    this.forgotEmail = sanitizeEmail(params.get('userEmail') ?? '');
    this.forgotInfoMessage = 'Código verificado. Define tu nueva contraseña.';
    this.forgotErrorMessage = '';
    this.loginErrorMessage = '';
  }

  private applyEmailLinkLoginSession(params: ParamMap) {
    const token = this.normalizeMagicLinkToken(params.get('sessionToken'));
    const expiresAtRaw = (params.get('sessionExpiresAt') ?? '').trim();
    const expiresAtMs = Date.parse(expiresAtRaw);

    if (!token || Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
      this.authStep = 'credentials';
      this.loginErrorMessage = 'La sesión del enlace expiró. Solicita un nuevo código.';
      this.clearEmailLinkQueryParams();
      return;
    }

    const userEmail = sanitizeEmail(params.get('userEmail') ?? '');
    const userName = sanitizePlainText(params.get('userName') ?? 'Usuario', {
      trim: true,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 80
    });
    const userId = this.normalizeUserId(params.get('userId')) || 'usr-email-link';
    const userRole = this.parseUserRole(params.get('userRole'));
    const userProfilePicture = this.normalizeOptionalUrl(params.get('userProfilePicture'));

    const session: AuthSession = {
      token,
      expiresAt: new Date(expiresAtMs).toISOString(),
      user: {
        id: userId,
        email: userEmail || 'usuario@huertoconnect.com',
        name: userName || 'Usuario',
        role: userRole,
        profile_picture: userProfilePicture
      }
    };

    this.authService.setSession(session);
    this.syncCurrentUserAndRedirect(userRole);
  }

  private applyEmailLinkErrorState(params: ParamMap) {
    const message = sanitizePlainText(params.get('magicLinkMessage') ?? '', {
      trim: true,
      collapseWhitespace: true,
      stripHtml: true,
      maxLength: 180
    });

    this.authStep = 'credentials';
    this.isRegister = false;
    this.loginInfoMessage = '';
    this.otpInfoMessage = '';
    this.otpErrorMessage = '';
    this.loginErrorMessage =
      message || 'El enlace expiró o es inválido. Solicita un nuevo código de verificación.';
  }

  private clearEmailLinkQueryParams() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  private clearAuthReasonQueryParam() {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { reason: null },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  private normalizeMagicLinkToken(value: string | null): string {
    const token = String(value ?? '').trim();
    if (!token) {
      return '';
    }

    return /^[A-Za-z0-9_-]{16,256}$/.test(token) ? token : '';
  }

  private normalizeUserId(value: string | null): string {
    const token = String(value ?? '').trim();
    if (!token) {
      return '';
    }

    return /^[A-Za-z0-9_-]{3,64}$/.test(token) ? token : '';
  }

  private parseUserRole(value: string | null): UserRole {
    const role = String(value ?? '').trim().toLowerCase();
    if (role === 'admin' || role === 'manager' || role === 'user') {
      return role;
    }
    return 'user';
  }

  private normalizeOptionalUrl(value: string | null): string | null {
    const normalized = String(value ?? '').trim();
    return normalized.length > 0 ? normalized : null;
  }

  private syncCurrentUserAndRedirect(fallbackRole: UserRole | null = null) {
    this.authService
      .getMe()
      .pipe(take(1))
      .subscribe({
        next: (user) => {
          const raw = (user.role as string).toLowerCase();
          const role: UserRole = raw === 'admin' ? 'admin' : raw === 'tecnico' ? 'manager' : 'user';
          this.redirectToDashboard(role, true);
        },
        error: () => this.redirectToDashboard(fallbackRole ?? this.authService.getUserRole(), true)
      });
  }

  private redirectToDashboard(role: UserRole | null, replaceUrl = false) {
    const targetRoute = getDashboardRouteByRole(role);
    void this.router.navigateByUrl(targetRoute, { replaceUrl });
  }

  private startWindLoop() {
    if (this.windFrame !== null) {
      return;
    }
    this.windFrame = requestAnimationFrame(() => this.stepWind());
  }

  private stepWind() {
    const damping = 0.12;
    this.windXPx += (this.targetWindXPx - this.windXPx) * damping;
    this.windYPx += (this.targetWindYPx - this.windYPx) * damping;

    const closeX = Math.abs(this.targetWindXPx - this.windXPx) < 0.08;
    const closeY = Math.abs(this.targetWindYPx - this.windYPx) < 0.08;

    if (closeX && closeY) {
      this.windXPx = this.targetWindXPx;
      this.windYPx = this.targetWindYPx;
      this.windFrame = null;
      return;
    }

    this.windFrame = requestAnimationFrame(() => this.stepWind());
  }

  private createSprouts(count: number): SproutParticle[] {
    const items: SproutParticle[] = [];
    let seed = 123456789;

    const rand = () => {
      seed = (1664525 * seed + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i++) {
      const phase = rand() * Math.PI * 2;
      const size = 14 + rand() * 16;
      const duration = 14 + rand() * 12;
      items.push({
        x: Number((rand() * 100).toFixed(2)),
        y: Number((-15 + rand() * 20).toFixed(2)),
        size: Number(size.toFixed(2)),
        delay: Number((-(rand() * duration)).toFixed(2)),
        duration: Number(duration.toFixed(2)),
        driftX: Number(((rand() - 0.5) * 18).toFixed(2)),
        driftY: Number((8 + rand() * 14).toFixed(2)),
        opacity: Number((0.22 + rand() * 0.32).toFixed(2)),
        rotate: Number((rand() * 360).toFixed(2))
      });
    }

    return items;
  }

  private configureOtpStep(response: SendOtpResponse) {
    this.resetLoginSecurityState();
    this.authStep = 'otp';
    this.otpChallengeId = response.challengeId;
    this.maskedLoginEmail = response.maskedEmail;
    this.setCodeDigits(response.devOtpCode ?? '');
    this.otpErrorMessage = '';
    this.otpInfoMessage = this.buildOtpInfoMessage(
      response.devOtpCode,
      'Ingresa el codigo que enviamos a tu correo para completar el acceso.'
    );
    this.canResendOtp = false;
    this.configureOtpTimer(response.expiresAt);
  }

  private enterOtpStepPending(email: string) {
    this.authStep = 'otp';
    this.otpChallengeId = '';
    this.maskedLoginEmail = this.maskEmailForDisplay(email);
    this.setCodeDigits('');
    this.otpErrorMessage = '';
    this.otpInfoMessage = 'Enviando codigo a tu correo...';
    this.canResendOtp = false;
    this.stopOtpTimer();
  }

  private enterForgotOtpStepPending(email: string) {
    this.authStep = 'forgot-otp';
    this.forgotChallengeId = '';
    this.forgotMaskedEmail = this.maskEmailForDisplay(email);
    this.setForgotCodeDigits('');
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = 'Enviando código a tu correo...';
    this.canResendForgotOtp = false;
    this.stopForgotOtpTimer();
  }

  private configureOtpTimer(expiresAtIso: string) {
    const parsedExpiresAt = Date.parse(expiresAtIso);
    this.otpExpiresAtMs = Number.isNaN(parsedExpiresAt)
      ? Date.now() + 5 * 60 * 1000
      : parsedExpiresAt;

    this.updateOtpCountdown();
    this.stopOtpTimer();

    if (typeof window !== 'undefined') {
      this.otpCountdownFrame = window.setInterval(() => this.updateOtpCountdown(), 1000);
    }
  }

  private updateOtpCountdown() {
    const remainingMs = Math.max(0, this.otpExpiresAtMs - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    this.otpCountdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remainingMs === 0) {
      this.canResendOtp = true;
      this.stopOtpTimer();
      if (!this.otpErrorMessage) {
        this.otpInfoMessage = 'Tu codigo expiro. Solicita uno nuevo para continuar.';
      }
    }
  }

  private stopOtpTimer() {
    if (this.otpCountdownFrame !== null && typeof window !== 'undefined') {
      window.clearInterval(this.otpCountdownFrame);
      this.otpCountdownFrame = null;
    }
  }

  private configureForgotOtpTimer(expiresAtIso: string) {
    const parsed = Date.parse(expiresAtIso);
    this.forgotOtpExpiresAtMs = Number.isNaN(parsed)
      ? Date.now() + 5 * 60 * 1000
      : parsed;

    this.updateForgotOtpCountdown();
    this.stopForgotOtpTimer();

    if (typeof window !== 'undefined') {
      this.forgotOtpCountdownFrame = window.setInterval(() => this.updateForgotOtpCountdown(), 1000);
    }
  }

  private updateForgotOtpCountdown() {
    const remainingMs = Math.max(0, this.forgotOtpExpiresAtMs - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    this.forgotOtpCountdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remainingMs === 0) {
      this.canResendForgotOtp = true;
      this.stopForgotOtpTimer();
      if (!this.forgotErrorMessage) {
        this.forgotInfoMessage = 'Tu código expiró. Solicita uno nuevo para continuar.';
      }
    }
  }

  private stopForgotOtpTimer() {
    if (this.forgotOtpCountdownFrame !== null && typeof window !== 'undefined') {
      window.clearInterval(this.forgotOtpCountdownFrame);
      this.forgotOtpCountdownFrame = null;
    }
  }

  private normalizeOtpCode(value: string): string {
    return value.replace(/\D/g, '').slice(0, 6);
  }

  private extractErrorMessage(error: unknown, fallbackMessage: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.message === 'string') {
      return error.error.message;
    }

    return fallbackMessage;
  }

  private buildOtpInfoMessage(devOtpCode: string | undefined, baseMessage: string): string {
    if (!devOtpCode) {
      return baseMessage;
    }

    return `${baseMessage} (Codigo de prueba: ${devOtpCode})`;
  }

  private maskEmailForDisplay(email: string): string {
    const [rawLocalPart = '', rawDomain = ''] = email.split('@');
    const localPart = rawLocalPart.trim();
    const domain = rawDomain.trim();

    if (!localPart || !domain) {
      return email;
    }

    if (localPart.length <= 2) {
      return `${localPart[0] ?? '*'}*@${domain}`;
    }

    return `${localPart.slice(0, 2)}***${localPart.slice(-1)}@${domain}`;
  }

  private setCodeDigits(code: string) {
    const normalized = this.normalizeOtpCode(code);
    this.codeDigits = this.codeDigits.map((_, index) => normalized[index] ?? '');
    this.syncOtpCodeFromDigits();
  }

  private syncOtpCodeFromDigits() {
    this.otpCode = this.codeDigits.join('');
  }

  private focusCodeDigit(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const element = document.getElementById(`code-digit-${index}`) as HTMLInputElement | null;
    if (!element) {
      return;
    }

    element.focus();
    element.select();
  }

  private setForgotCodeDigits(code: string) {
    const normalized = this.normalizeOtpCode(code);
    this.forgotCodeDigits = this.forgotCodeDigits.map((_, index) => normalized[index] ?? '');
    this.syncForgotOtpCodeFromDigits();
  }

  private syncForgotOtpCodeFromDigits() {
    this.forgotOtpCode = this.forgotCodeDigits.join('');
  }

  private focusForgotCodeDigit(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const element = document.getElementById(`forgot-code-digit-${index}`) as HTMLInputElement | null;
    if (!element) {
      return;
    }

    element.focus();
    element.select();
  }

  private configureRegOtpTimer(expiresAtIso: string) {
    const parsed = Date.parse(expiresAtIso);
    this.regOtpExpiresAtMs = Number.isNaN(parsed)
      ? Date.now() + 5 * 60 * 1000
      : parsed;

    this.updateRegOtpCountdown();
    this.stopRegOtpTimer();

    if (typeof window !== 'undefined') {
      this.regOtpCountdownFrame = window.setInterval(() => this.updateRegOtpCountdown(), 1000);
    }
  }

  private updateRegOtpCountdown() {
    const remainingMs = Math.max(0, this.regOtpExpiresAtMs - Date.now());
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    this.regOtpCountdownText = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    if (remainingMs === 0) {
      this.canResendRegisterOtp = true;
      this.stopRegOtpTimer();
      if (!this.regOtpErrorMessage) {
        this.regOtpInfoMessage = 'Tu código expiró. Solicita uno nuevo para continuar.';
      }
    }
  }

  private stopRegOtpTimer() {
    if (this.regOtpCountdownFrame !== null && typeof window !== 'undefined') {
      window.clearInterval(this.regOtpCountdownFrame);
      this.regOtpCountdownFrame = null;
    }
  }

  private setRegCodeDigits(code: string) {
    const normalized = this.normalizeOtpCode(code);
    this.regCodeDigits = this.regCodeDigits.map((_, index) => normalized[index] ?? '');
    this.syncRegOtpCodeFromDigits();
  }

  private syncRegOtpCodeFromDigits() {
    this.regOtpCode = this.regCodeDigits.join('');
  }

  private focusRegCodeDigit(index: number) {
    if (typeof document === 'undefined') {
      return;
    }

    const el = document.getElementById(`reg-code-digit-${index}`) as HTMLInputElement | null;
    if (!el) {
      return;
    }

    el.focus();
    el.select();
  }

  private getFieldErrors(field: LoginFieldKey): string[] {
    switch (field) {
      case 'loginEmail':
        return validateEmailValue(this.loginEmail, {
          required: true,
          label: 'El correo electrónico'
        });
      case 'loginPassword':
        return validatePasswordValue(this.loginPassword, {
          required: true,
          minLength: 8,
          maxLength: 64,
          requireStrongPattern: false,
          label: 'La contraseña'
        });
      case 'forgotEmail':
        return validateEmailValue(this.forgotEmail, {
          required: true,
          label: 'El correo electrónico'
        });
      case 'forgotNewPassword':
        return validatePasswordValue(this.forgotNewPassword, {
          required: true,
          minLength: 8,
          maxLength: 64,
          requireStrongPattern: true,
          label: 'La nueva contraseña'
        });
      case 'forgotConfirmPassword':
        return this.validatePasswordConfirmation(
          this.forgotConfirmPassword,
          this.forgotNewPassword,
          'La confirmación de contraseña'
        );
      case 'registerName':
        return validateNameValue(this.registerName, {
          required: true,
          label: 'El nombre'
        });
      case 'registerApellidos':
        return validateNameValue(this.registerApellidos, {
          required: false,
          label: 'Los apellidos'
        });
      case 'registerEmail':
        return validateEmailValue(this.registerEmail, {
          required: true,
          label: 'El correo electrónico'
        });
      case 'registerPassword':
        return validatePasswordValue(this.registerPassword, {
          required: true,
          minLength: 8,
          maxLength: 64,
          requireStrongPattern: true,
          label: 'La contraseña'
        });
      case 'registerConfirmPassword':
        return this.validatePasswordConfirmation(
          this.registerConfirmPassword,
          this.registerPassword,
          'La confirmación de contraseña'
        );
      default:
        return [];
    }
  }

  private validatePasswordConfirmation(
    confirmPasswordValue: string,
    basePasswordValue: string,
    label: string
  ): string[] {
    const confirmPassword = sanitizePassword(confirmPasswordValue);
    const basePassword = sanitizePassword(basePasswordValue);

    if (!confirmPassword) {
      return [`${label} es obligatoria.`];
    }

    if (confirmPassword.length < 8) {
      return [`${label} debe tener al menos 8 caracteres.`];
    }

    if (confirmPassword.length > 64) {
      return [`${label} no puede exceder 64 caracteres.`];
    }

    if (confirmPassword !== basePassword) {
      return ['Las contraseñas no coinciden.'];
    }

    return [];
  }

  private getFieldValue(field: LoginFieldKey): string {
    switch (field) {
      case 'loginEmail':
        return this.loginEmail;
      case 'loginPassword':
        return this.loginPassword;
      case 'forgotEmail':
        return this.forgotEmail;
      case 'forgotNewPassword':
        return this.forgotNewPassword;
      case 'forgotConfirmPassword':
        return this.forgotConfirmPassword;
      case 'registerName':
        return this.registerName;
      case 'registerApellidos':
        return this.registerApellidos;
      case 'registerEmail':
        return this.registerEmail;
      case 'registerPassword':
        return this.registerPassword;
      case 'registerConfirmPassword':
        return this.registerConfirmPassword;
      default:
        return '';
    }
  }

  private markFieldsAsTouched(fields: LoginFieldKey[]) {
    for (const field of fields) {
      this.fieldTouchedState[field] = true;
    }
  }

  private resetFieldTouchedState(fields: LoginFieldKey[]) {
    for (const field of fields) {
      this.fieldTouchedState[field] = false;
    }
  }

  private getCredentialsValidationError(): string {
    return (
      this.getFieldErrors('loginEmail')[0] ??
      this.getFieldErrors('loginPassword')[0] ??
      'Revisa tus credenciales.'
    );
  }

  private getRegisterValidationError(): string {
    return (
      this.getFieldErrors('registerName')[0] ??
      this.getFieldErrors('registerApellidos')[0] ??
      this.getFieldErrors('registerEmail')[0] ??
      this.getFieldErrors('registerPassword')[0] ??
      this.getFieldErrors('registerConfirmPassword')[0] ??
      'Revisa la información de registro.'
    );
  }

  private composeLoginError(baseMessage: string): string {
    const securityMessage = this.getLoginSecurityMessage();
    if (securityMessage) {
      return securityMessage;
    }

    return baseMessage;
  }

  private registerFailedLoginAttempt() {
    this.failedLoginAttempts += 1;

    if (this.failedLoginAttempts >= this.maxFailedLoginAttempts) {
      this.loginLockedUntilMs = Date.now() + this.loginLockDurationMs;
    }
  }

  private resetLoginSecurityState() {
    this.failedLoginAttempts = 0;
    this.loginLockedUntilMs = 0;
  }

  private getLoginSecurityMessage(): string | null {
    const now = Date.now();

    if (now < this.loginLockedUntilMs) {
      return 'Acceso bloqueado temporalmente por seguridad.';
    }

    return null;
  }

  private resetForgotPasswordFlow() {
    this.stopForgotOtpTimer();
    this.forgotEmail = '';
    this.forgotChallengeId = '';
    this.forgotMaskedEmail = '';
    this.forgotOtpCode = '';
    this.setForgotCodeDigits('');
    this.forgotResetToken = '';
    this.forgotOtpCountdownText = '05:00';
    this.canResendForgotOtp = false;
    this.forgotNewPassword = '';
    this.forgotConfirmPassword = '';
    this.forgotErrorMessage = '';
    this.forgotInfoMessage = '';
    this.isSubmittingForgotRequest = false;
    this.isVerifyingForgotOtp = false;
    this.isResendingForgotOtp = false;
    this.isSubmittingPasswordReset = false;
    this.fieldTouchedState.forgotEmail = false;
    this.fieldTouchedState.forgotNewPassword = false;
    this.fieldTouchedState.forgotConfirmPassword = false;
    this.showForgotNewPassword = false;
    this.showForgotConfirmPassword = false;
  }

  private resetPasswordVisibility() {
    this.showLoginPassword = false;
    this.showForgotNewPassword = false;
    this.showForgotConfirmPassword = false;
    this.showRegisterPassword = false;
    this.showRegisterConfirmPassword = false;
  }

  private isPasswordVisible(field: PasswordFieldKey): boolean {
    switch (field) {
      case 'loginPassword':
        return this.showLoginPassword;
      case 'forgotNewPassword':
        return this.showForgotNewPassword;
      case 'forgotConfirmPassword':
        return this.showForgotConfirmPassword;
      case 'registerPassword':
        return this.showRegisterPassword;
      case 'registerConfirmPassword':
        return this.showRegisterConfirmPassword;
      default:
        return false;
    }
  }
}
