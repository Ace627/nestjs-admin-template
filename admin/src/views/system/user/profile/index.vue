<template>
  <div class="app-content">
    <el-row :gutter="16">
      <el-col :md="7" :xl="24">
        <el-card v-if="!loading" shadow="never" header="个人信息">
          <div class="user-avatar" title="点击修改头像" @click="userAvatarRef?.open()">
            <img :src="resolveFileUrl(profile.avatar) || defaultAvatar" alt="用户头像" />
            <div class="avatar-mask flex-center">
              <SvgIcon name="Plus" size="22px" />
            </div>
          </div>
          <el-descriptions :column="1">
            <el-descriptions-item label="用户昵称">{{ profile.nickname }}</el-descriptions-item>
            <el-descriptions-item label="手机号码">{{ profile.phone }}</el-descriptions-item>
            <el-descriptions-item label="用户邮箱">{{ profile.email }}</el-descriptions-item>
            <el-descriptions-item label="所属角色">{{ profile.roleGroup?.join(' / ') }}</el-descriptions-item>
            <el-descriptions-item label="创建日期">{{ dayjs(profile.createTime).format('YYYY-MM-DD HH:mm:ss') }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>

      <el-col :md="17" :xl="24">
        <el-card shadow="never">
          <el-tabs>
            <el-tab-pane label="基本信息">
              <UserInfo :user="profile" @refresh="getProfile" />
            </el-tab-pane>
            <el-tab-pane label="修改密码">
              <UpdatePassword />
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>

    <UserAvatar ref="userAvatarRef" @refresh="getProfile" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'Profile' })
import UserInfo from './UserInfo.vue'
import UpdatePassword from './UpdatePassword.vue'
import UserAvatar from './UserAvatar.vue'
import { resolveFileUrl } from '@/utils'
import { UserRequest } from '@/api/system/user.request'
import type { User } from '@/types'
import dayjs from 'dayjs'
import defaultAvatar from '@/assets/images/default-avatar.jpg'

const loading = ref(false)
const userAvatarRef = useTemplateRef('userAvatarRef')
const profile = ref({} as User.UserProfile)

/** 查询个人信息 */
async function getProfile() {
  try {
    loading.value = true
    profile.value = await UserRequest.getProfile()
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : String(error)
    console.log('getProfile errMsg: ', errMsg)
    return Promise.reject(error)
  } finally {
    loading.value = false
  }
}

getProfile()
</script>

<style lang="scss" scoped>
.user-avatar {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 16px;
  overflow: hidden;
  cursor: pointer;
  border-radius: 50%;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .avatar-mask {
    position: absolute;
    inset: 0;
    color: #fff;
    background-color: rgb(0 0 0 / 40%);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover .avatar-mask {
    opacity: 1;
  }
}

:deep(.el-descriptions__label) {
  font-weight: bold;
}

html[data-device='mobile'] .el-col + .el-col {
  margin-top: 16px;
}
</style>
