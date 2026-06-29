import { nanoid } from 'nanoid';
import { ID_LENGTH, TOKEN_LENGTH } from './constants';

export function generateAudioId(): string {
  return nanoid(ID_LENGTH);
}

export function generateToken(): string {
  return nanoid(TOKEN_LENGTH);
}
