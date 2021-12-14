import {
  getModelForClass,
  prop,
  DocumentType,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Base, TimeStamps } from '@typegoose/typegoose/lib/defaultClasses';
import type { Types } from 'mongoose';

export class User extends TimeStamps implements Base {
  _id: Types.ObjectId;
  id: string;

  /**
   * 用户名 不可被修改
   * 与email必有一个
   */
  @prop()
  username?: string;

  /**
   * 邮箱 不可被修改
   * 必填
   */
  @prop({
    index: true,
    unique: true,
  })
  email: string;

  @prop()
  password!: string;

  /**
   * 可以被修改的显示名
   */
  @prop({
    trim: true,
    maxlength: 16,
  })
  nickname!: string;

  /**
   * 识别器, 跟username构成全局唯一的用户名
   * 用于搜索
   * <username>#<discriminator>
   */
  @prop()
  discriminator: string;

  /**
   * 是否为临时用户
   * @default false
   */
  @prop({
    default: false,
  })
  temporary: boolean;

  /**
   * 头像
   */
  @prop()
  avatar?: string;

  /**
   * 生成身份识别器
   * 0001 - 9999
   */
  public static generateDiscriminator(
    this: ReturnModelType<typeof User>,
    nickname: string
  ): Promise<string> {
    let restTimes = 10; // 最多找10次
    const checkDiscriminator = async () => {
      const discriminator = String(
        Math.floor(Math.random() * 9999) + 1
      ).padStart(4, '0');

      const doc = await this.findOne({
        nickname,
        discriminator,
      }).exec();
      restTimes--;

      if (doc !== null) {
        // 已存在, 换一个
        if (restTimes <= 0) {
          throw new Error('Cannot find space discriminator');
        }

        return checkDiscriminator();
      }

      return discriminator;
    };

    return checkDiscriminator();
  }
}

export type UserDocument = DocumentType<User>;

const model = getModelForClass(User);

export type UserModel = typeof model;

export default model;
