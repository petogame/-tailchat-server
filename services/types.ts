import type { Context } from 'moleculer';
import type { TFunction } from 'i18next';
import type { Group } from '../models/group/group';
import type { User } from '../models/user/user';

export interface UserJWTPayload {
  _id: string;
  nickname: string;
  email: string;
  avatar: string;
}

export interface UserLoginRes extends User {
  token: string;
}

interface TranslationMeta {
  t: TFunction;
}

export type PureContext<P = {}> = Context<P, {}>;

export type TcPureContext<P = {}, M = {}> = Context<P, TranslationMeta & M>;

export type TcContext<P = {}, M = {}> = Context<
  P,
  {
    user: UserJWTPayload;
    token: string;
    userId: string;

    /**
     * 仅在 socket.io 的请求中会出现
     */
    socketId?: string;
  } & TranslationMeta &
    M
>;

export type GroupBaseInfo = Pick<Group, 'name' | 'avatar' | 'owner'> & {
  memberCount: number;
};
