import _ from 'lodash';
import type { Context } from 'moleculer';
import { Types } from 'mongoose';
import { DataNotFoundError, EntityError } from '../../lib/errors';
import { isValidStr } from '../../lib/utils';
import type { TcDbService } from '../../mixins/db.mixin';
import {
  Group,
  GroupDocument,
  GroupModel,
  GroupPanel,
  GroupPanelType,
} from '../../models/group/group';
import { TcService } from '../base';
import type { TcContext } from '../types';

interface GroupService
  extends TcService,
    TcDbService<GroupDocument, GroupModel> {}
class GroupService extends TcService {
  get serviceName(): string {
    return 'group';
  }

  onInit(): void {
    this.registerDb('group.group');

    this.registerAction('createGroup', this.createGroup, {
      params: {
        name: 'string',
        panels: 'array',
      },
    });
    this.registerAction('getUserGroups', this.getUserGroups);
    this.registerAction(
      'getJoinedGroupAndPanelIds',
      this.getJoinedGroupAndPanelIds
    );
    this.registerAction('getGroupBasicInfo', this.getGroupBasicInfo, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('isGroupOwner', this.isGroupOwner, {
      params: {
        groupId: 'string',
      },
    });
    this.registerAction('joinGroup', this.joinGroup, {
      params: {
        groupId: 'string',
      },
      visibility: 'public',
    });
  }

  /**
   * 创建群组
   */
  async createGroup(
    ctx: TcContext<{
      name: string;
      panels: GroupPanel[];
    }>
  ) {
    const name = ctx.params.name;
    const panels = ctx.params.panels;
    const owner = ctx.meta.userId;

    const group = await this.adapter.model.createGroup({
      name,
      panels,
      owner,
    });

    return this.transformDocuments(ctx, {}, group);
  }

  async getUserGroups(ctx: TcContext): Promise<Group[]> {
    const userId = ctx.meta.userId;

    const groups = await this.adapter.model.getUserGroups(userId);

    return this.transformDocuments(ctx, {}, groups);
  }

  /**
   * 获取用户所有加入群组的群组id列表与聊天会话id列表
   */
  async getJoinedGroupAndPanelIds(ctx: TcContext): Promise<{
    groupIds: string[];
    panelIds: string[];
  }> {
    const groups = await this.getUserGroups(ctx); // TODO: 应该使用call而不是直接调用，为了获取tracer和caching支持。目前moleculer的文档没有显式的声明类似localCall的行为，可以花时间看一下
    const panels = _.flatten(groups.map((g) => g.panels)).filter(
      (panel) =>
        // TODO: 先无视权限, 把所有的信息全部显示
        panel.type === GroupPanelType.TEXT
    );

    return {
      groupIds: groups.map((g) => String(g._id)),
      panelIds: panels.map((p) => p.id),
    };
  }

  /**
   * 获取群组基本信息
   */
  async getGroupBasicInfo(
    ctx: Context<{
      groupId: string;
    }>
  ) {
    const group = await this.adapter.model
      .findById(ctx.params.groupId, {
        name: 1,
        avatar: 1,
        owner: 1,
        members: 1,
      })
      .exec();

    if (group === null) {
      return null;
    }

    const groupMemberCount = group.members.length;

    return {
      name: group.name,
      avatar: group.avatar,
      owner: group.owner,
      memberCount: groupMemberCount,
    };
  }

  /**
   * 检测用户是否为群组所有者
   */
  async isGroupOwner(
    ctx: TcContext<{
      groupId: string;
    }>
  ): Promise<boolean> {
    const group = await this.adapter.model.findById(ctx.params.groupId);
    if (!group) {
      throw new DataNotFoundError('没有找到群组');
    }

    return String(group.owner) === ctx.meta.userId;
  }

  /**
   * 加入群组
   */
  async joinGroup(
    ctx: TcContext<{
      groupId: string;
    }>
  ) {
    const groupId = ctx.params.groupId;
    const userId = ctx.meta.userId;

    if (!isValidStr(userId)) {
      throw new EntityError('用户id为空');
    }

    if (!isValidStr(groupId)) {
      throw new EntityError('群组id为空');
    }

    const doc = await this.adapter.model
      .findByIdAndUpdate(
        groupId,
        {
          $addToSet: {
            members: {
              userId: Types.ObjectId(userId),
            },
          },
        },
        {
          new: true,
        }
      )
      .exec();

    const group = await this.transformDocuments(ctx, {}, doc);

    this.roomcastNotify(ctx, groupId, 'updateInfo', group);

    return group;
  }
}

export default GroupService;
