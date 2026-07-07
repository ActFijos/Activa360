import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

@Injectable()
export class KeycloakGuard implements CanActivate {
  private readonly jwksUri: string;
  private readonly client: jwksClient.JwksClient;

  constructor() {
    const realm = process.env.KEYCLOAK_REALM || 'activa360';
    const keycloakUrl = process.env.KEYCLOAK_URL || 'http://localhost:8080';
    this.jwksUri = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/certs`;

    this.client = jwksClient({
      jwksUri: this.jwksUri,
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 10,
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token de autorización ausente o inválido');
    }

    const token = authHeader.split(' ')[1];

    try {
      const decodedToken = await this.validateToken(token);
      request.user = decodedToken;
      return true;
    } catch (error) {
      throw new UnauthorizedException(`Autenticación fallida: ${error.message}`);
    }
  }

  private validateToken(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // Obtener la clave pública dinámicamente mediante el encabezado del token (kid)
      const getKey = (header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) => {
        this.client.getSigningKey(header.kid, (err, key) => {
          if (err) {
            return callback(err);
          }
          const signingKey = key?.getPublicKey();
          callback(null, signingKey);
        });
      };

      jwt.verify(token, getKey, { algorithms: ['RS256'] }, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  }
}
