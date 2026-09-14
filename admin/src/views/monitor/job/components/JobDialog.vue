<template>
  <el-dialog v-model="visible" :title="dialogTitle" :close-on-click-modal="false" :width="dialogWidth">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="任务名称" prop="jobName">
        <el-input v-model="form.jobName" placeholder="请输入任务名称" />
      </el-form-item>
      <el-form-item label="任务组名" prop="jobGroup">
        <el-select v-model="form.jobGroup" placeholder="请选择任务组名" style="width: 100%">
          <el-option v-for="item in sys_job_group" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="调用目标" prop="invokeTarget">
        <el-input v-model="form.invokeTarget" placeholder="请输入调用目标字符串，如 JobService.test()" />
      </el-form-item>
      <el-form-item label="执行表达式" prop="cronExpression">
        <el-input v-model="form.cronExpression" placeholder="请输入 cron 执行表达式，如 0/10 * * * * ?">
          <template #append>
            <el-button @click="openCrontab">生成</el-button>
          </template>
        </el-input>
      </el-form-item>
      <el-form-item label="并发执行" prop="concurrent">
        <el-radio-group v-model="form.concurrent">
          <el-radio value="1">允许</el-radio>
          <el-radio value="0">禁止</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="计划策略" prop="misfirePolicy">
        <el-radio-group v-model="form.misfirePolicy">
          <el-radio value="1">立即执行</el-radio>
          <el-radio value="2">执行一次</el-radio>
          <el-radio value="3">放弃执行</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="任务状态" prop="status">
        <el-radio-group v-model="form.status">
          <el-radio value="1">正常</el-radio>
          <el-radio value="0">暂停</el-radio>
        </el-radio-group>
      </el-form-item>
    </el-form>
    <!-- Cron 表达式生成器 -->
    <CrontabDialog ref="crontabDialogRef" @confirm="handleCronConfirm" />
    <template #footer>
      <el-button @click="close">取消</el-button>
      <el-button type="primary" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
defineOptions({ name: 'JobDialog' })
import { TipModal } from '@/utils'
import type { Job } from '@/types'
import type { FormRules } from 'element-plus'
import { CronExpressionParser } from 'cron-parser'
import { JobRequest } from '@/api/monitor/job.request'

const emits = defineEmits<{ getList: [] }>()

const appStore = useAppStore()
const { sys_job_group } = useDict('sys_job_group')

const visible = ref(false)
const formRef = useTemplateRef('formRef')
const crontabDialogRef = useTemplateRef('crontabDialogRef')
const form = ref({} as Partial<Job.Item>)
const isUpdate = ref(false)
const dialogWidth = computed(() => (appStore.isDesktop ? '600px' : 'calc(100% - 32px)'))
const dialogTitle = computed(() => (isUpdate.value ? '编辑定时任务' : '新增定时任务'))

/** cron 表达式前端即时校验（与后端 cron-parser 同源解析） */
function validateCronExpression(_rule: unknown, value: string, callback: (error?: Error) => void) {
  if (!value) return callback()
  try {
    CronExpressionParser.parse(value)
    callback()
  } catch {
    callback(new Error('执行表达式不是合法的 cron 表达式'))
  }
}

const rules: FormRules = {
  jobName: [{ required: true, message: '任务名称不能为空', trigger: 'blur' }],
  jobGroup: [{ required: true, message: '任务组名不能为空', trigger: 'change' }],
  invokeTarget: [{ required: true, message: '调用目标不能为空', trigger: 'blur' }],
  cronExpression: [
    { required: true, message: '执行表达式不能为空', trigger: 'blur' },
    { validator: validateCronExpression, trigger: 'blur' },
  ],
  status: [{ required: true, message: '任务状态不能为空', trigger: 'change' }],
}

async function open(record?: Job.Item) {
  visible.value = true
  isUpdate.value = !!record
  resetForm(record?.id)
}

async function resetForm(id?: string) {
  if (id) {
    form.value = await JobRequest.findOneById({ id })
    return
  }
  form.value = {
    jobGroup: 'DEFAULT',
    concurrent: '0',
    misfirePolicy: '1',
    status: '1',
  }
}

function close() {
  formRef.value?.resetFields()
  visible.value = false
}

/** 打开 Cron 生成器弹窗，携带当前表达式用于回显 */
function openCrontab() {
  crontabDialogRef.value?.open(form.value.cronExpression)
}

/** 生成器确认后回写表达式 */
function handleCronConfirm(cron: string) {
  form.value.cronExpression = cron
  formRef.value?.validateField('cronExpression')
}

async function handleSubmit() {
  await formRef.value?.validate()
  isUpdate.value ? await JobRequest.update(form.value) : await JobRequest.create(form.value)
  TipModal.msgSuccess(isUpdate.value ? '更新成功' : '添加成功')
  close()
  emits('getList')
}

defineExpose({ open })
</script>

<style lang="scss" scoped></style>
