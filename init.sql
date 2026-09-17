/*
 Navicat Premium Data Transfer

 Source Server         : 本机 Docker 的数据库
 Source Server Type    : MySQL
 Source Server Version : 80046
 Source Host           : localhost:3306
 Source Schema         : nestdemo

 Target Server Type    : MySQL
 Target Server Version : 80046
 File Encoding         : 65001

 Date: 18/09/2026 00:09:57
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for sys_config
-- ----------------------------
DROP TABLE IF EXISTS `sys_config`;
CREATE TABLE `sys_config`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `config_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数名称',
  `config_key` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数键名',
  `config_value` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '参数键值（统一存字符串，业务侧自行转换类型）',
  `config_type` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N' COMMENT '系统内置（Y内置 N非内置，内置参数禁止删除与改键名）',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_config_key`(`config_key` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_config
-- ----------------------------
INSERT INTO `sys_config` VALUES ('2026-09-17 22:56:18', '2026-09-17 23:31:24', NULL, 'admin', 'admin', '076189e6-d54f-4d00-93c8-9a17cba9608f', '账号自助-验证码开关', 'sys.account.captchaEnabled', 'true', 'Y', '是否开启验证码功能（true开启，false关闭）');
INSERT INTO `sys_config` VALUES ('2026-09-17 23:31:56', '2026-09-17 23:31:56', NULL, 'admin', 'admin', '52700ffd-f68f-4233-abcf-cf93273a7ca0', '用户管理-账号初始密码', 'sys.user.initPassword', '12345678', 'Y', '初始化密码 12345678');

-- ----------------------------
-- Table structure for sys_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_dept`;
CREATE TABLE `sys_dept`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '父部门ID（0 表示根部门）',
  `ancestors` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '祖级列表（如 0,101,102，冗余字段用于子树查询）',
  `dept_name` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '部门名称',
  `leader` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '负责人',
  `phone` varchar(11) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '联系电话',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `dept_sort` int NOT NULL DEFAULT 0 COMMENT '显示顺序',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '部门状态',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_dept
-- ----------------------------
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:39:36', '2026-09-04 22:39:36', NULL, 'admin', 'admin', '15252559-aced-4480-a361-549b13720aa6', 'ac2a115f-7ee4-465a-9392-e68544e28850', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,ac2a115f-7ee4-465a-9392-e68544e28850', '财务部门', '云禾', NULL, NULL, 4, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:41:32', '2026-09-04 22:41:32', NULL, 'admin', 'admin', '28d096d9-3510-4e72-b0bf-cbd4e96f98b7', 'd3e747cf-f705-4ac0-bef2-89b578f1a256', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,d3e747cf-f705-4ac0-bef2-89b578f1a256', '财务部门', '云禾', NULL, NULL, 2, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:39:48', '2026-09-04 22:39:48', NULL, 'admin', 'admin', '626ec141-cc73-4b99-900d-0561cd9a34d6', 'ac2a115f-7ee4-465a-9392-e68544e28850', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,ac2a115f-7ee4-465a-9392-e68544e28850', '运维部门', '云禾', NULL, NULL, 5, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:39:01', '2026-09-04 22:39:01', NULL, 'admin', 'admin', '6cb1af9f-bbbe-42be-a639-2e7c72c8514e', 'ac2a115f-7ee4-465a-9392-e68544e28850', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,ac2a115f-7ee4-465a-9392-e68544e28850', '市场部门', '云禾', NULL, NULL, 2, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:39:19', '2026-09-04 22:39:19', NULL, 'admin', 'admin', '75724b34-8608-4003-9811-5cc7fe25968a', 'ac2a115f-7ee4-465a-9392-e68544e28850', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,ac2a115f-7ee4-465a-9392-e68544e28850', '测试部门', '云禾', NULL, NULL, 3, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:38:43', '2026-09-04 22:38:43', NULL, 'admin', 'admin', '76c9b7cc-71d9-47ef-b718-bb4277e94d5f', 'ac2a115f-7ee4-465a-9392-e68544e28850', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,ac2a115f-7ee4-465a-9392-e68544e28850', '研发部门', '云禾', NULL, NULL, 1, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:38:30', '2026-09-04 22:38:30', NULL, 'admin', 'admin', 'ac2a115f-7ee4-465a-9392-e68544e28850', 'bb93a81a-039e-4cc3-a90d-9dce0857dde1', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1', '北京分公司', '云禾', NULL, NULL, 1, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:41:22', '2026-09-04 22:41:22', NULL, 'admin', 'admin', 'af3bd6d6-7a64-4c22-9abd-3d964524edf8', 'd3e747cf-f705-4ac0-bef2-89b578f1a256', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1,d3e747cf-f705-4ac0-bef2-89b578f1a256', '市场部门', '云禾', NULL, NULL, 1, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 20:29:15', '2026-09-04 20:29:15', NULL, 'admin', 'admin', 'bb93a81a-039e-4cc3-a90d-9dce0857dde1', '0', '0', '云禾科技', '云禾', NULL, NULL, 1, '1');
INSERT INTO `sys_dept` VALUES ('2026-09-04 22:40:04', '2026-09-04 22:40:04', NULL, 'admin', 'admin', 'd3e747cf-f705-4ac0-bef2-89b578f1a256', 'bb93a81a-039e-4cc3-a90d-9dce0857dde1', '0,bb93a81a-039e-4cc3-a90d-9dce0857dde1', '上海分公司', '云禾', NULL, NULL, 2, '1');

-- ----------------------------
-- Table structure for sys_dict_data
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict_data`;
CREATE TABLE `sys_dict_data`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dict_sort` int NOT NULL DEFAULT 1 COMMENT '排序',
  `list_class` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '表格回显样式',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1',
  `dict_label` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '字典标签',
  `dict_value` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '字典值',
  `dict_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '字典类型',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_dict_type_value`(`dict_type` ASC, `dict_value` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_dict_data
-- ----------------------------
INSERT INTO `sys_dict_data` VALUES ('2026-09-05 00:47:28', '2026-09-05 00:47:28', NULL, 'admin', 'admin', '0dfd1ab0-cd71-4c6d-89b3-da7761d5f7c0', 2, 'danger', '1', '停用', '0', 'sys_normal_disable', '停用状态');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 11:55:38', '2026-09-04 11:55:38', NULL, 'admin', 'admin', '1700f36f-6fdb-4767-91e2-bc7cea4d814d', 2, NULL, '1', '女', '1', 'sys_user_sex', '性别女');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:04:03', '2026-09-05 23:36:46', NULL, 'admin', 'admin', '18780a30-c520-4388-aca6-635c47838e67', 6, 'warning', '1', '导入', '6', 'sys_oper_type', '导入操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 11:55:55', '2026-09-04 11:55:55', NULL, 'admin', 'admin', '1951aeb2-8417-493e-b80a-7b3628bf312c', 3, NULL, '1', '未知', '2', 'sys_user_sex', '性比未知');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 11:58:03', '2026-09-04 11:58:03', NULL, 'admin', 'admin', '198f70a9-c1dc-4899-aa07-d1176f9a7e6d', 1, 'primary', '1', '成功', '1', 'sys_common_status', '成功状态');
INSERT INTO `sys_dict_data` VALUES ('2026-09-06 13:34:20', '2026-09-06 13:34:20', NULL, 'admin', 'admin', '2588be7b-7081-4dab-84f7-e1966ab82fdb', 1, NULL, '1', '默认分组', 'DEFAULT', 'sys_job_group', '默认分组');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:00:58', '2026-09-04 12:00:58', NULL, 'admin', 'admin', '34f8e4b4-955f-41ab-a88d-4886f5c7f91e', 99, 'info', '1', '其它', '0', 'sys_oper_type', '其它操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-05 00:46:11', '2026-09-05 00:47:38', NULL, 'admin', 'admin', '41fe2dca-196c-44d9-8476-3a95d06514e9', 1, 'primary', '1', '正常', '1', 'sys_normal_disable', '正常状态');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:02:15', '2026-09-04 12:02:15', NULL, 'admin', 'admin', '52385a47-5342-4d7a-bc54-3d766498b33f', 4, 'danger', '1', '清空', '4', 'sys_oper_type', '清空操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:01:29', '2026-09-04 12:01:29', NULL, 'admin', 'admin', '6524b680-3560-4643-bf75-077f5201a047', 2, 'info', '1', '编辑', '2', 'sys_oper_type', '编辑操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-05 23:36:19', '2026-09-05 23:36:52', NULL, 'admin', 'admin', '6d8ad468-cf06-469f-ab49-2a1d86e76dce', 7, 'warning', '1', '导出', '7', 'sys_oper_type', '导出操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-06 13:34:34', '2026-09-06 13:34:34', NULL, 'admin', 'admin', '76a4b714-e497-44ed-ad7f-6e6508336f34', 1, NULL, '1', '系统分组', 'SYSTEM', 'sys_job_group', '系统分组');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:02:43', '2026-09-04 12:02:49', NULL, 'admin', 'admin', '844519bd-e25d-47e7-927f-a0b1538667f1', 5, 'danger', '1', '强退', '5', 'sys_oper_type', '强退操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 11:24:52', '2026-09-04 11:50:02', NULL, 'admin', 'admin', '96fd1a45-a280-4588-82b4-8e36e688cb79', 1, NULL, '1', '男', '0', 'sys_user_sex', '性别男');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:01:11', '2026-09-04 12:01:11', NULL, 'admin', 'admin', '9c7cb3ea-6418-4f54-b81b-0790f8411fe8', 1, 'info', '1', '新增', '1', 'sys_oper_type', '新增操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-05 00:54:06', '2026-09-05 00:54:06', NULL, 'admin', 'admin', 'a09eae84-711e-4582-8559-f84edc6f0cf0', 2, 'danger', '1', '隐藏', '0', 'sys_menu_visible', '菜单侧栏隐藏');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 12:01:53', '2026-09-04 12:01:53', NULL, 'admin', 'admin', 'e4a48565-1dae-42d9-9ea5-4de71dffed5d', 3, 'danger', '1', '删除', '3', 'sys_oper_type', '删除操作');
INSERT INTO `sys_dict_data` VALUES ('2026-09-04 11:58:19', '2026-09-04 11:59:23', NULL, 'admin', 'admin', 'eaed69dc-a0ef-410c-ab93-dbe4d85e4c05', 2, 'danger', '1', '失败', '0', 'sys_common_status', '失败状态');
INSERT INTO `sys_dict_data` VALUES ('2026-09-05 00:53:46', '2026-09-05 00:53:46', NULL, 'admin', 'admin', 'f5b7bacd-b92d-4bf8-b1ca-e84b2c2aad42', 1, 'primary', '1', '显示', '1', 'sys_menu_visible', '菜单侧栏显示');

-- ----------------------------
-- Table structure for sys_dict_type
-- ----------------------------
DROP TABLE IF EXISTS `sys_dict_type`;
CREATE TABLE `sys_dict_type`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `dict_name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '字典名称',
  `dict_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_f4e4273658733a3bbe6a2479bf`(`dict_type` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_dict_type
-- ----------------------------
INSERT INTO `sys_dict_type` VALUES ('2026-09-04 11:57:23', '2026-09-04 11:57:23', NULL, 'admin', 'admin', '0bd0c435-f76c-4df5-864f-01e04e75c735', '系统状态', 'sys_common_status', '1', '系统状态列表');
INSERT INTO `sys_dict_type` VALUES ('2026-09-06 13:33:59', '2026-09-06 13:33:59', NULL, 'admin', 'admin', '93c28995-8c28-490d-aabb-b4fd9f3b6446', '任务分组', 'sys_job_group', '1', '任务分组列表');
INSERT INTO `sys_dict_type` VALUES ('2026-09-05 00:53:26', '2026-09-05 00:53:26', NULL, 'admin', 'admin', 'a0587b75-283f-49a0-bf01-907d3856fe75', '菜单显隐', 'sys_menu_visible', '1', '菜单显隐列表');
INSERT INTO `sys_dict_type` VALUES ('2026-09-04 11:23:31', '2026-09-04 11:50:02', NULL, 'admin', 'admin', 'a23eabbb-55b9-4d40-a4f9-249fe1bfd369', '用户性别', 'sys_user_sex', '1', '用户性别列表');
INSERT INTO `sys_dict_type` VALUES ('2026-09-05 00:45:44', '2026-09-05 00:45:44', NULL, 'admin', 'admin', 'a478879e-49df-47af-9484-1f0cd0cc3f18', '数据状态', 'sys_normal_disable', '1', '数据状态列表');
INSERT INTO `sys_dict_type` VALUES ('2026-09-04 12:00:03', '2026-09-04 12:00:03', NULL, 'admin', 'admin', 'ead1f56d-7252-48e9-8aa5-33b2ffe44f41', '操作类型', 'sys_oper_type', '1', '操作类型列表');

-- ----------------------------
-- Table structure for sys_file
-- ----------------------------
DROP TABLE IF EXISTS `sys_file`;
CREATE TABLE `sys_file`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '父节点ID（0 表示根节点）',
  `ancestors` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '祖级列表（如 0,{uuid}，冗余字段用于子树级联查询）',
  `file_type` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '类型（D目录 F文件）',
  `file_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '名称（目录名或文件原始名）',
  `file_hash` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '文件 SHA-256（目录为 null）',
  `file_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '相对存储路径（目录为 null）',
  `file_size` int NULL DEFAULT NULL COMMENT '文件大小（字节，目录为 null）',
  `file_ext` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '扩展名（含点，如 .png，目录为 null）',
  `mime_type` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'MIME 类型（目录为 null）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Records of sys_file
-- ----------------------------

-- ----------------------------
-- Table structure for sys_job
-- ----------------------------
DROP TABLE IF EXISTS `sys_job`;
CREATE TABLE `sys_job`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务ID',
  `job_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '任务名称',
  `job_group` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DEFAULT' COMMENT '任务组名',
  `invoke_target` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '调用目标字符串（格式：Service.method(参数)）',
  `cron_expression` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT 'cron执行表达式',
  `misfire_policy` varchar(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '3' COMMENT '计划执行错误策略（1立即执行 2执行一次 3放弃执行）',
  `concurrent` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否并发执行（1允许 0禁止）',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '任务状态（1正常 0暂停）',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_job
-- ----------------------------
INSERT INTO `sys_job` VALUES ('2026-09-06 13:37:45', '2026-09-06 13:37:45', NULL, 'admin', 'admin', '8d42758c-03e9-42cc-a9c2-92a3d6f9d90f', '测试', 'DEFAULT', 'JobService.test()', '* * * * * *', '1', '0', '0');

-- ----------------------------
-- Table structure for sys_job_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_job_log`;
CREATE TABLE `sys_job_log`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '任务日志ID',
  `job_name` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '任务名称',
  `job_group` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'DEFAULT' COMMENT '任务组名',
  `invoke_target` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '调用目标字符串',
  `job_message` varchar(500) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '日志信息',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '执行状态',
  `create_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '执行时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_job_log
-- ----------------------------
INSERT INTO `sys_job_log` VALUES ('0bc30cf5-8b42-4a00-bc17-966b4d6a462c', '测试', 'DEFAULT', 'JobService.test()', '执行成功', '1', '2026-09-16 10:10:31');

-- ----------------------------
-- Table structure for sys_login_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_login_log`;
CREATE TABLE `sys_login_log`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '访问ID',
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户账号',
  `ip` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '登录IP地址',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '登录地点',
  `browser` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '浏览器类型',
  `os` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作系统',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '登录状态',
  `message` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '提示消息',
  `login_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '登录日期',
  `request_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求唯一标识',
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_login_log
-- ----------------------------
INSERT INTO `sys_login_log` VALUES ('0284ecf6-ac26-48c5-b68b-cfbf5acafa61', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:03', '37059000-7d4d-4a62-922a-bc037becaa5f', NULL);
INSERT INTO `sys_login_log` VALUES ('1006eb2f-faa3-4f51-9aba-c67000762537', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '账号或密码错误，还可尝试 2 次', '2026-09-16 10:08:32', 'af2a1862-8845-42bc-b60e-855282c68a19', NULL);
INSERT INTO `sys_login_log` VALUES ('1eb8e0de-2484-4cce-8d73-cb09cb784a5a', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:10', 'ae8ef923-cef8-495b-bb7c-9b1ca4dd6e4b', NULL);
INSERT INTO `sys_login_log` VALUES ('22035fc7-0cce-4bea-b600-38ee548af249', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 10:08:39', '9546413e-5802-4a0d-9af8-bf58e7e73b9f', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('2379ebd8-e147-4ff2-a7c2-cb5da8bfd81d', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-17 19:54:26', 'e214e57d-96aa-4dfa-93f1-61c9223fa435', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('2d31250d-1f01-4074-a284-15bc8df6f51b', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '账号或密码错误，还可尝试 3 次', '2026-09-16 10:08:29', '7dbd798f-04b1-467f-877e-cabc1fbe4d2a', NULL);
INSERT INTO `sys_login_log` VALUES ('30804730-dc55-4675-a417-0b2a3b4eb5a0', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-17 20:22:21', '97601e74-8c51-4f70-8cd6-163379a3dac1', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('40a33aeb-f699-40e4-b0cc-dd4bf0b816ec', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:07', '3f74b913-59a9-4408-afa7-b756b24e7169', NULL);
INSERT INTO `sys_login_log` VALUES ('53791c3d-1677-4006-994a-8b59a1ec2453', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-17 19:54:36', '4484ca10-b1ab-4392-a02f-1f0dac6fd22a', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('5da45076-5e28-45ae-bbe3-373f16ad3d02', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '账号或密码错误，还可尝试 4 次', '2026-09-16 10:08:26', '0e2ba113-51b9-4cb0-a237-f0c53748cbd7', NULL);
INSERT INTO `sys_login_log` VALUES ('5ecfebed-f7a6-411f-854a-51b73d4bd0df', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 15:04:34', '42fe9aea-baac-4a0e-86d0-c69493d48a4e', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('74b05442-9288-4719-a4ab-1a58717616f8', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 19:28:18', 'a6b06ba7-4873-4902-b209-426173637362', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('888aacec-61f1-4d35-afa8-1e86112a1a51', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-17 22:57:30', '833cc6c4-abc4-436d-8beb-abcd7c794d1f', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('89767467-ff15-473e-a434-ee47ee844396', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 18:55:49', '2d6df8a1-11e8-42df-8e82-8fbcbd8b606e', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('958d8831-62ea-4317-9517-e69f5e91b21e', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 10:04:32', '4ac2006e-fa2a-492c-acc6-33e48bffb475', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('aa993343-5900-47e6-9fc2-5be42d705b11', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 16:31:48', 'ae74dee5-5d17-48eb-b9dd-5d80be564da2', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('ac7d2bc3-2b79-4a36-a319-08196502d245', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:19', '7a6f5878-e212-43dc-8161-a1804bc60b6a', NULL);
INSERT INTO `sys_login_log` VALUES ('b5e021bf-a840-4bfd-91d0-d97a67963d5e', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:16', '80325e6d-9f93-4cfd-9e30-42974f77ee6c', NULL);
INSERT INTO `sys_login_log` VALUES ('c97f3a46-4991-4ac8-a8bb-a972512f3d1b', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 21:45:42', '29faf120-c6e7-4d92-9bf5-03cac4154ebe', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('cc5b9689-c4b8-46fb-aabb-ab0ce894494c', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 09:24:24', 'efe3cff6-b885-41d0-ae2e-4c16ca794756', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('da951825-2629-4b1a-aa11-ec7b0b66a8d4', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-17 23:29:05', '3da7a3f6-81a7-4318-9fdb-f26ff22eb3fc', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('e229a4fa-6347-4270-a8e0-1692c10c256c', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '账号或密码错误，还可尝试 1 次', '2026-09-16 10:08:35', '536604f6-5510-4cbf-8abd-d55b695038b5', NULL);
INSERT INTO `sys_login_log` VALUES ('f1f7da1c-75e9-4c7a-aefc-e4f50d635cbb', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:00', '03266eed-babc-4aed-a3a8-4667f53f4c91', NULL);
INSERT INTO `sys_login_log` VALUES ('fa697d1e-7b4e-4f26-967d-728bd7629add', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-17 22:39:21', 'ee3ad6b4-5a55-480a-8c22-f7a49e3c6c00', '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_login_log` VALUES ('fc55d315-f031-4ea9-8df1-7ee56d3d2c65', 'admin1', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '0', '该账号不存在或已停用', '2026-09-16 10:04:13', '135bf4ac-8b04-41a5-8599-2e796e60d869', NULL);
INSERT INTO `sys_login_log` VALUES ('fdefa5e9-39d2-4aad-bda0-2385a7c7c2c1', 'admin', '127.0.0.1', '内网IP', 'Chrome134.0.0.0', 'Windows10', '1', '登录成功', '2026-09-16 10:03:16', 'd24e2667-82d8-4abe-995c-124395153e7c', '866b0232-507b-42a4-bdc1-47fc4a83616a');

-- ----------------------------
-- Table structure for sys_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_menu`;
CREATE TABLE `sys_menu`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '上级菜单',
  `path` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '路由地址',
  `component` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '组件路径',
  `menu_type` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'M' COMMENT '类型（M目录 C菜单 F按钮）',
  `icon` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '菜单图标',
  `menu_name` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '菜单名称',
  `visible` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '菜单是否可见',
  `permission` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '权限字符（如 system:user:create，仅 C/F 类型）',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '数据状态',
  `menu_sort` int NOT NULL DEFAULT 1 COMMENT '显示顺序',
  `is_cache` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '是否缓存组件',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_menu
-- ----------------------------
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:15:48', '2026-09-04 19:15:48', NULL, 'admin', 'admin', '005bab30-96d7-46a8-9bdf-408a0621ba2e', '8762a399-1606-496c-98ee-1fed23bcedc7', NULL, NULL, 'F', NULL, '用户新增', '1', 'system:user:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:18:45', '2026-09-04 19:18:45', NULL, 'admin', 'admin', '0292f5fa-cf2f-45ba-90a3-92caeb8c535b', '1f575ab8-fa15-428d-b91d-5aae8470e141', NULL, NULL, 'F', NULL, '菜单查询', '1', 'system:menu:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:25:57', '2026-09-12 16:45:39', NULL, 'admin', 'admin', '02a449f1-db61-4f04-95e2-90fc1f36fefd', '760c23de-73fa-4d69-8d1c-674a235d3799', 'cache', 'monitor/cache/index', 'C', 'Redis', '缓存监控', '1', NULL, '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 11:11:55', '2026-09-13 11:11:55', NULL, 'admin', 'admin', '04c9f319-98b8-4a24-93e6-4deee0e16c01', 'ce940b28-31f7-45f2-b1ce-59af70c2dd58', NULL, NULL, 'F', NULL, '文件新增', '1', 'system:file:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:20:15', '2026-09-04 23:05:28', NULL, 'admin', 'admin', '072089b6-7900-4778-9558-7f7e5e212a58', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'dept', 'system/dept/index', 'C', 'Dept', '部门管理', '1', NULL, '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:36:54', '2026-09-16 22:02:57', NULL, 'admin', 'admin', '0eadc556-6f6e-4ac1-bfe5-f747f7fcc89e', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', 'signature', 'example/signature/index', 'C', 'Resource', '手写签名版', '1', NULL, '1', 66, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:20:44', '2026-09-04 19:20:44', NULL, 'admin', 'admin', '0f88a474-ad08-4fd5-a797-df15caed5661', '072089b6-7900-4778-9558-7f7e5e212a58', NULL, NULL, 'F', NULL, '部门新增', '1', 'system:dept:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 11:11:42', '2026-09-13 11:11:42', NULL, 'admin', 'admin', '117de56b-e395-4556-b1a7-1f745c281064', 'ce940b28-31f7-45f2-b1ce-59af70c2dd58', NULL, NULL, 'F', NULL, '文件查询', '1', 'system:file:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:19:04', '2026-09-04 19:19:04', NULL, 'admin', 'admin', '1472f10a-d5ca-464e-aca6-05cff9e62616', '1f575ab8-fa15-428d-b91d-5aae8470e141', NULL, NULL, 'F', NULL, '菜单编辑', '1', 'system:menu:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-17 22:50:51', '2026-09-17 22:50:51', NULL, 'admin', 'admin', '149bc63f-a824-4bcc-b1b5-dd204671521e', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'config', 'system/config/index', 'C', 'ChatGPT', '参数设置', '1', NULL, '1', 6, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:16:08', '2026-09-04 19:16:08', NULL, 'admin', 'admin', '15752f04-6c88-4bce-a073-d138d863585f', '8762a399-1606-496c-98ee-1fed23bcedc7', NULL, NULL, 'F', NULL, '用户删除', '1', 'system:user:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:25:16', '2026-09-04 19:25:16', NULL, 'admin', 'admin', '1aefdd00-7052-4397-8969-94ec7c5d2068', '963bbd9d-0ef9-46a3-8e92-81cf1a1a8dd8', NULL, NULL, 'F', NULL, '在线用户强退', '1', 'monitor:online:forceLogout', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:20:32', '2026-09-04 19:20:32', NULL, 'admin', 'admin', '1cf51c82-ecd8-41a9-8384-fb1133e567b2', '072089b6-7900-4778-9558-7f7e5e212a58', NULL, NULL, 'F', NULL, '部门查询', '1', 'system:dept:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:25:38', '2026-09-13 21:25:38', NULL, 'admin', 'admin', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', '0', 'example', NULL, 'M', 'Github', '效果案例', '1', NULL, '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:22:43', '2026-09-04 19:22:43', NULL, 'admin', 'admin', '1e549f6a-eb8f-4873-b79d-0a99369fa2f0', '631474ec-7487-4039-aab3-fb120a627d90', NULL, NULL, 'F', NULL, '字典删除', '1', 'system:dict:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:18:17', '2026-09-04 19:18:24', NULL, 'admin', 'admin', '1f575ab8-fa15-428d-b91d-5aae8470e141', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'menu', 'system/menu/index', 'C', 'Menu', '菜单管理', '1', NULL, '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:22:28', '2026-09-04 19:22:28', NULL, 'admin', 'admin', '23ab7e63-3f07-406d-8701-63907ce6d9a5', '631474ec-7487-4039-aab3-fb120a627d90', NULL, NULL, 'F', NULL, '字典编辑', '1', 'system:dict:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:20:53', '2026-09-04 19:20:53', NULL, 'admin', 'admin', '2695904c-a686-4c12-84b7-6134ab666cbc', '072089b6-7900-4778-9558-7f7e5e212a58', NULL, NULL, 'F', NULL, '部门编辑', '1', 'system:dept:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:28:39', '2026-09-04 19:28:39', NULL, 'admin', 'admin', '2894c7f0-dc07-443f-b812-d2f17f600329', 'df37b091-b128-45a0-9666-137748fb36f0', NULL, NULL, 'F', NULL, '操作日志删除', '1', 'monitor:operlog:delete', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:17:24', '2026-09-04 19:17:24', NULL, 'admin', 'admin', '2c3caeb6-26b6-4f33-a07b-671e30263aba', '90ccc73f-9508-42d4-8f5e-f1d0c1da97c4', NULL, NULL, 'F', NULL, '角色新增', '1', 'system:role:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-17 22:53:20', '2026-09-17 22:53:20', NULL, 'admin', 'admin', '35b1f827-eec9-4ac3-802a-44220e134e8b', '149bc63f-a824-4bcc-b1b5-dd204671521e', NULL, NULL, 'F', NULL, '参数刷新', '1', 'system:config:refresh', '1', 5, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:17:49', '2026-09-04 19:17:49', NULL, 'admin', 'admin', '360de6d6-3e66-469c-a2c4-f81acdd7b473', '90ccc73f-9508-42d4-8f5e-f1d0c1da97c4', NULL, NULL, 'F', NULL, '角色删除', '1', 'system:role:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:49:06', '2026-09-16 22:02:52', NULL, 'admin', 'admin', '39a3b5a3-7e03-42dc-aa69-85d998cad25b', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', 'upload', 'example/upload/index', 'C', 'Resource', '大文件上传', '1', NULL, '1', 55, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:29:39', '2026-09-06 13:22:31', NULL, 'admin', 'admin', '41a045fd-5077-4694-ae65-78e4f7120a7f', '760c23de-73fa-4d69-8d1c-674a235d3799', 'loginlog', 'monitor/loginlog/index', 'C', 'Loginlog', '登录日志', '1', NULL, '1', 7, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-05 23:39:57', '2026-09-05 23:39:57', NULL, 'admin', 'admin', '43aeefe8-3704-471b-a494-bf0b1c4a6446', '41a045fd-5077-4694-ae65-78e4f7120a7f', NULL, NULL, 'F', NULL, '登录日志导入', '1', 'monitor:loginlog:import', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-05 15:11:14', '2026-09-05 15:52:38', NULL, 'admin', 'admin', '4534a44e-8baa-4ed2-8545-1ae11fde5538', '656742cc-c81b-4d5d-8a33-524469e84cfc', NULL, NULL, 'F', NULL, '缓存删除', '1', 'monitor:cache:delete', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:15:34', '2026-09-04 19:15:34', NULL, 'admin', 'admin', '4bf51da7-9633-432b-8fab-5f40051dd4eb', '8762a399-1606-496c-98ee-1fed23bcedc7', NULL, NULL, 'F', NULL, '用户查询', '1', 'system:user:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:31:11', '2026-09-05 23:39:48', NULL, 'admin', 'admin', '5017e6d1-6b6d-4e7e-890c-e8d22fe43dd7', '41a045fd-5077-4694-ae65-78e4f7120a7f', NULL, NULL, 'F', NULL, '登录日志导出', '1', 'monitor:loginlog:export', '1', 5, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:37:42', '2026-09-13 21:46:29', NULL, 'admin', 'admin', '542222c7-5206-4a44-8386-6abd30376c71', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', 'price', 'example/price/index', 'C', 'Resource', '定价卡片', '1', NULL, '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 11:12:10', '2026-09-13 11:12:10', NULL, 'admin', 'admin', '5fa5e798-f1bd-4518-9531-b6e1c442a8af', 'ce940b28-31f7-45f2-b1ce-59af70c2dd58', NULL, NULL, 'F', NULL, '文件编辑', '1', 'system:file:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:30:30', '2026-09-04 19:30:30', NULL, 'admin', 'admin', '6012fb93-4997-4a55-9e83-ff32b18f7ae4', '41a045fd-5077-4694-ae65-78e4f7120a7f', NULL, NULL, 'F', NULL, '登录日志查询', '1', 'monitor:loginlog:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:28:20', '2026-09-04 19:28:20', NULL, 'admin', 'admin', '61aeed28-36bd-4bbb-b012-4668061933ac', 'df37b091-b128-45a0-9666-137748fb36f0', NULL, NULL, 'F', NULL, '操作日志查询', '1', 'monitor:operlog:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:22:19', '2026-09-04 19:22:19', NULL, 'admin', 'admin', '62808f35-de2b-41cc-a1c3-dfab0f8835d6', '631474ec-7487-4039-aab3-fb120a627d90', NULL, NULL, 'F', NULL, '字典新增', '1', 'system:dict:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:21:37', '2026-09-04 19:21:37', NULL, 'admin', 'admin', '631474ec-7487-4039-aab3-fb120a627d90', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'dict', 'system/dict/index', 'C', 'Dict', '字典管理', '1', NULL, '1', 5, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:26:29', '2026-09-06 13:22:39', NULL, 'admin', 'admin', '656742cc-c81b-4d5d-8a33-524469e84cfc', '760c23de-73fa-4d69-8d1c-674a235d3799', 'cache/list', 'monitor/cache/list', 'C', 'CacheList', '缓存列表', '1', NULL, '1', 5, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 11:12:24', '2026-09-13 11:12:24', NULL, 'admin', 'admin', '66090e1b-ba7e-4b5e-ab48-217e5241a8d6', 'ce940b28-31f7-45f2-b1ce-59af70c2dd58', NULL, NULL, 'F', NULL, '文件删除', '1', 'system:file:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:18:55', '2026-09-04 19:18:55', NULL, 'admin', 'admin', '711a6df6-7206-4bd5-8fbe-ace9ccd1e2ee', '1f575ab8-fa15-428d-b91d-5aae8470e141', NULL, NULL, 'F', NULL, '菜单新增', '1', 'system:menu:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:23:56', '2026-09-06 13:23:56', NULL, 'admin', 'admin', '74b437d3-5665-4b37-9a9d-420f82dba5be', 'd50c6827-b234-4549-9f98-ea029eb42d56', NULL, NULL, 'F', NULL, '定时任务查询', '1', 'monitor:job:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:25:00', '2026-09-04 19:25:00', NULL, 'admin', 'admin', '75c5788d-b06b-4b9c-b52e-21a3c82a57f0', '963bbd9d-0ef9-46a3-8e92-81cf1a1a8dd8', NULL, NULL, 'F', NULL, '在线用户查询', '1', 'monitor:online:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:23:55', '2026-09-04 19:23:55', NULL, 'admin', 'admin', '760c23de-73fa-4d69-8d1c-674a235d3799', '0', 'monitor', NULL, 'M', 'Monitor', '系统监控', '1', NULL, '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:23:21', '2026-09-13 11:09:31', NULL, 'admin', 'admin', '78cb1bc1-41b6-47e5-ad47-448708d2cc31', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'icon', 'system/icon/index', 'C', 'Image', '系统图标', '1', NULL, '1', 16, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:31:00', '2026-09-04 19:31:00', NULL, 'admin', 'admin', '7c623ede-4cc9-45ba-acc2-0760c79f6de8', '41a045fd-5077-4694-ae65-78e4f7120a7f', NULL, NULL, 'F', NULL, '登录日志清空', '1', 'monitor:loginlog:clear', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:24:10', '2026-09-06 13:24:10', NULL, 'admin', 'admin', '7f912b4d-6ece-4514-b1f0-185190554a33', 'd50c6827-b234-4549-9f98-ea029eb42d56', NULL, NULL, 'F', NULL, '定时任务新增', '1', 'monitor:job:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-05 15:12:36', '2026-09-05 15:52:46', NULL, 'admin', 'admin', '862277c2-39c6-439a-9999-6e5ec37e5693', '656742cc-c81b-4d5d-8a33-524469e84cfc', NULL, NULL, 'F', NULL, '缓存清空', '1', 'monitor:cache:clear', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:15:15', '2026-09-04 19:15:15', NULL, 'admin', 'admin', '8762a399-1606-496c-98ee-1fed23bcedc7', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'user', 'system/user/index', 'C', 'User', '用户管理', '1', NULL, '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:30:44', '2026-09-04 19:30:44', NULL, 'admin', 'admin', '876c8c7c-2b95-463d-af59-b94a794c6603', '41a045fd-5077-4694-ae65-78e4f7120a7f', NULL, NULL, 'F', NULL, '登录日志删除', '1', 'monitor:loginlog:delete', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-17 22:52:17', '2026-09-17 22:52:17', NULL, 'admin', 'admin', '89f3b309-c6ec-43df-a579-e98bdbee2612', '149bc63f-a824-4bcc-b1b5-dd204671521e', NULL, NULL, 'F', NULL, '参数新增', '1', 'system:config:create', '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 11:18:27', '2026-09-13 11:18:27', NULL, 'admin', 'admin', '8b0d4fc1-23d4-4ec4-85b5-e6bedec214c8', 'ce940b28-31f7-45f2-b1ce-59af70c2dd58', NULL, NULL, 'F', NULL, '文件回收站', '1', 'system:file:recycle', '1', 5, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:24:47', '2026-09-06 13:24:47', NULL, 'admin', 'admin', '8fc4ba91-3f37-4845-9cd8-952caab69ae2', 'd50c6827-b234-4549-9f98-ea029eb42d56', NULL, NULL, 'F', NULL, '定时任务清空', '1', 'monitor:job:clear', '1', 5, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:16:43', '2026-09-04 19:16:58', NULL, 'admin', 'admin', '90ccc73f-9508-42d4-8f5e-f1d0c1da97c4', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'role', 'system/role/index', 'C', 'Role', '角色管理', '1', NULL, '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:29:04', '2026-09-04 19:29:04', NULL, 'admin', 'admin', '91abb82b-fd3d-497f-a6ed-83aa3d03f866', 'df37b091-b128-45a0-9666-137748fb36f0', NULL, NULL, 'F', NULL, '操作日志导出', '1', 'monitor:operlog:export', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:24:30', '2026-09-04 19:24:30', NULL, 'admin', 'admin', '963bbd9d-0ef9-46a3-8e92-81cf1a1a8dd8', '760c23de-73fa-4d69-8d1c-674a235d3799', 'online', 'monitor/online/index', 'C', 'Online', '在线用户', '1', NULL, '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:17:15', '2026-09-04 19:17:15', NULL, 'admin', 'admin', '97d07e96-10f4-48d1-90e4-8e5c1adcce2d', '90ccc73f-9508-42d4-8f5e-f1d0c1da97c4', NULL, NULL, 'F', NULL, '角色查询', '1', 'system:role:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:24:35', '2026-09-06 13:24:35', NULL, 'admin', 'admin', '99f2d619-97c9-4d50-8128-e6adbe48c88a', 'd50c6827-b234-4549-9f98-ea029eb42d56', NULL, NULL, 'F', NULL, '定时任务删除', '1', 'monitor:job:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:21:57', '2026-09-04 19:21:57', NULL, 'admin', 'admin', 'a9fbcb95-4769-4217-a8ab-6b3330c02b68', '631474ec-7487-4039-aab3-fb120a627d90', NULL, NULL, 'F', NULL, '字典查询', '1', 'system:dict:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:24:57', '2026-09-06 13:24:57', NULL, 'admin', 'admin', 'ad696f4d-0a87-4644-9b2f-e6202e2f4d19', 'd50c6827-b234-4549-9f98-ea029eb42d56', NULL, NULL, 'F', NULL, '定时任务导出', '1', 'monitor:job:export', '1', 6, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-17 22:52:56', '2026-09-17 22:52:56', NULL, 'admin', 'admin', 'af1aa23a-49c2-4dd4-a2c4-cb3ba2806e2c', '149bc63f-a824-4bcc-b1b5-dd204671521e', NULL, NULL, 'F', NULL, '参数编辑', '1', 'system:config:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:28:51', '2026-09-04 19:28:51', NULL, 'admin', 'admin', 'b271b1db-4f09-43cc-aebd-b71be24b533d', 'df37b091-b128-45a0-9666-137748fb36f0', NULL, NULL, 'F', NULL, '操作日志清空', '1', 'monitor:operlog:clear', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-17 22:53:09', '2026-09-17 22:53:09', NULL, 'admin', 'admin', 'b8aad4be-acb5-40eb-b4ad-91c48c11c255', '149bc63f-a824-4bcc-b1b5-dd204671521e', NULL, NULL, 'F', NULL, '参数删除', '1', 'system:config:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:19:11', '2026-09-04 19:19:11', NULL, 'admin', 'admin', 'bc1336ce-ec31-446a-9b9e-24f64410c09a', '1f575ab8-fa15-428d-b91d-5aae8470e141', NULL, NULL, 'F', NULL, '菜单删除', '1', 'system:menu:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:24:23', '2026-09-06 13:24:23', NULL, 'admin', 'admin', 'bf804def-4636-4131-bf3f-22bd6f9d1f82', 'd50c6827-b234-4549-9f98-ea029eb42d56', NULL, NULL, 'F', NULL, '定时任务编辑', '1', 'monitor:job:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:14:35', '2026-09-04 19:14:35', NULL, 'admin', 'admin', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', '0', 'system', NULL, 'M', 'Setting', '系统管理', '1', NULL, '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:26:54', '2026-09-06 15:52:04', NULL, 'admin', 'admin', 'c4057b22-024f-450e-a9fe-4a4799416dca', '760c23de-73fa-4d69-8d1c-674a235d3799', 'server', 'monitor/server/index', 'C', 'Server', '服务监控', '1', NULL, '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 11:10:05', '2026-09-17 22:45:29', NULL, 'admin', 'admin', 'ce940b28-31f7-45f2-b1ce-59af70c2dd58', 'c0e187f4-9550-4d69-ac3b-f9f0b1db46f3', 'file', 'system/file/index', 'C', 'FileManagement', '文件管理', '1', NULL, '1', 7, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:38:50', '2026-09-13 21:46:32', NULL, 'admin', 'admin', 'd3696afb-07da-43b6-9d98-48063649202d', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', 'charts', 'example/charts/index', 'C', 'Resource', '图表效果', '1', NULL, '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-06 13:23:41', '2026-09-06 13:23:41', NULL, 'admin', 'admin', 'd50c6827-b234-4549-9f98-ea029eb42d56', '760c23de-73fa-4d69-8d1c-674a235d3799', 'job', 'monitor/job/index', 'C', 'Schedule', '定时任务', '1', NULL, '1', 2, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-05 17:44:03', '2026-09-05 17:44:03', NULL, 'admin', 'admin', 'd8b682e4-dabf-4d24-939d-881c551de2f7', 'c4057b22-024f-450e-a9fe-4a4799416dca', NULL, NULL, 'F', NULL, '服务监控查询', '1', 'monitor:server:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:27:43', '2026-09-06 13:22:36', NULL, 'admin', 'admin', 'df37b091-b128-45a0-9666-137748fb36f0', '760c23de-73fa-4d69-8d1c-674a235d3799', 'operlog', 'monitor/operlog/index', 'C', 'Operation', '操作日志', '1', NULL, '1', 6, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-17 22:52:04', '2026-09-17 22:52:04', NULL, 'admin', 'admin', 'e0c4e87c-8e2f-4f28-b646-493f2d8bd201', '149bc63f-a824-4bcc-b1b5-dd204671521e', NULL, NULL, 'F', NULL, '参数查询', '1', 'system:config:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-05 15:53:02', '2026-09-05 15:53:02', NULL, 'admin', 'admin', 'e1a5e5dc-3db6-450f-bab4-20d551d44d81', '656742cc-c81b-4d5d-8a33-524469e84cfc', NULL, NULL, 'F', NULL, '缓存查询', '1', 'monitor:cache:query', '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:33:54', '2026-09-13 21:33:54', NULL, 'admin', 'admin', 'e5f6c690-eec4-4cfc-8088-aab59f17241c', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', 'watermark', 'example/watermark/index', 'C', 'Resource', '水印效果', '1', NULL, '1', 1, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:21:02', '2026-09-04 19:21:02', NULL, 'admin', 'admin', 'ee1a082b-fa9f-4d85-aeaf-b85251d6b2bc', '072089b6-7900-4778-9558-7f7e5e212a58', NULL, NULL, 'F', NULL, '部门删除', '1', 'system:dept:delete', '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:16:00', '2026-09-04 19:16:00', NULL, 'admin', 'admin', 'f53ab5f4-d97e-4334-9eec-9e2fac3db0f0', '8762a399-1606-496c-98ee-1fed23bcedc7', NULL, NULL, 'F', NULL, '用户编辑', '1', 'system:user:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-04 19:17:40', '2026-09-04 19:17:40', NULL, 'admin', 'admin', 'f5f342d2-d8c4-448e-b779-aee07f42262f', '90ccc73f-9508-42d4-8f5e-f1d0c1da97c4', NULL, NULL, 'F', NULL, '角色编辑', '1', 'system:role:update', '1', 3, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-13 21:40:56', '2026-09-13 21:46:36', NULL, 'admin', 'admin', 'f74c0978-415d-4c5f-beef-4c48c640d61d', '1e0c60bb-d20f-478b-b8a3-2ece6802238e', 'countdown', 'example/countdown/index', 'C', 'Resource', '数字滚动', '1', NULL, '1', 4, '0');
INSERT INTO `sys_menu` VALUES ('2026-09-05 15:18:26', '2026-09-05 15:18:26', NULL, 'admin', 'admin', 'f97c36b6-ff41-43fb-85d5-f1d1e8128cd6', '631474ec-7487-4039-aab3-fb120a627d90', NULL, NULL, 'F', NULL, '字典刷新', '1', 'system:dict:refresh', '1', 5, '0');

-- ----------------------------
-- Table structure for sys_oper_log
-- ----------------------------
DROP TABLE IF EXISTS `sys_oper_log`;
CREATE TABLE `sys_oper_log`  (
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '模块标题',
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作人员',
  `method` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '方法名称',
  `request_method` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求方式',
  `params` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL COMMENT '请求参数',
  `url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求接口',
  `ip` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求IP',
  `location` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求地址',
  `business_type` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '操作类型',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '操作状态',
  `oper_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '请求时间',
  `request_id` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '请求唯一标识',
  `duration` int NULL DEFAULT NULL COMMENT '请求耗时',
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '操作人员ID',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_oper_log
-- ----------------------------
INSERT INTO `sys_oper_log` VALUES ('01b44304-f183-4759-8cec-f87fa1052193', '菜单管理', 'admin', 'MenuController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"menuType\": \"C\",\n    \"parentId\": \"c0e187f4-9550-4d69-ac3b-f9f0b1db46f3\",\n    \"menuSort\": 6,\n    \"status\": \"1\",\n    \"visible\": \"1\",\n    \"isCache\": \"0\",\n    \"component\": \"system/config/index\",\n    \"path\": \"config\",\n    \"menuName\": \"参数设置\",\n    \"icon\": \"ChatGPT\"\n  }\n}', '/api/system/menu/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:50:51', 'd8e5a744-77e1-4254-a87d-d8ac856e4500', 32, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('0361a5a9-5952-4df4-9fb7-f33eeb2e4baa', '参数管理', 'admin', 'ConfigController.update', 'PUT', '{\n  \"query\": {},\n  \"body\": {\n    \"createTime\": \"2026-09-17 22:56:18\",\n    \"updateTime\": \"2026-09-17 23:28:38\",\n    \"deleteTime\": null,\n    \"createBy\": \"admin\",\n    \"updateBy\": \"admin\",\n    \"id\": \"076189e6-d54f-4d00-93c8-9a17cba9608f\",\n    \"configName\": \"登录验证码\",\n    \"configKey\": \"sys.account.captchaEnabled\",\n    \"configValue\": \"false\",\n    \"configType\": \"Y\",\n    \"remark\": \"是否开启验证码功能（true开启，false关闭）\"\n  }\n}', '/api/system/config/update', '127.0.0.1', '内网IP', '2', '1', '2026-09-17 23:28:49', '1a31f3d7-a43f-49e1-af1b-620fe908011d', 24, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('04132c34-19df-4586-978d-ed91a2370588', '参数管理', 'admin', 'ConfigController.update', 'PUT', '{\n  \"query\": {},\n  \"body\": {\n    \"createTime\": \"2026-09-17 22:56:18\",\n    \"updateTime\": \"2026-09-17 23:28:49\",\n    \"deleteTime\": null,\n    \"createBy\": \"admin\",\n    \"updateBy\": \"admin\",\n    \"id\": \"076189e6-d54f-4d00-93c8-9a17cba9608f\",\n    \"configName\": \"登录验证码\",\n    \"configKey\": \"sys.account.captchaEnabled\",\n    \"configValue\": \"true\",\n    \"configType\": \"Y\",\n    \"remark\": \"是否开启验证码功能（true开启，false关闭）\"\n  }\n}', '/api/system/config/update', '127.0.0.1', '内网IP', '2', '1', '2026-09-17 23:28:55', '4522404a-93c6-4860-8229-341d7a9b0787', 33, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('1223d77c-3250-48f9-ac87-30c3e3b5fae3', '菜单管理', 'admin', 'MenuController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"menuType\": \"F\",\n    \"parentId\": \"149bc63f-a824-4bcc-b1b5-dd204671521e\",\n    \"menuSort\": 5,\n    \"status\": \"1\",\n    \"visible\": \"1\",\n    \"isCache\": \"0\",\n    \"menuName\": \"参数刷新\",\n    \"permission\": \"system:config:refresh\"\n  }\n}', '/api/system/menu/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:53:20', 'd3f8d489-70d9-4c95-a00a-bf4e025322c0', 28, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('3c54cab7-e99d-4ea5-9ce2-60c20e84d01e', '菜单管理', 'admin', 'MenuController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"menuType\": \"F\",\n    \"parentId\": \"149bc63f-a824-4bcc-b1b5-dd204671521e\",\n    \"menuSort\": 3,\n    \"status\": \"1\",\n    \"visible\": \"1\",\n    \"isCache\": \"0\",\n    \"menuName\": \"参数编辑\",\n    \"permission\": \"system:config:update\"\n  }\n}', '/api/system/menu/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:52:57', '30136233-462b-432f-87f8-98f7cd8daa83', 36, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('5c9f7de6-ecc2-4344-af5a-41a2bdccd32b', '参数管理', 'admin', 'ConfigController.update', 'PUT', '{\n  \"query\": {},\n  \"body\": {\n    \"createTime\": \"2026-09-17 22:56:18\",\n    \"updateTime\": \"2026-09-17 22:56:18\",\n    \"deleteTime\": null,\n    \"createBy\": \"admin\",\n    \"updateBy\": \"admin\",\n    \"id\": \"076189e6-d54f-4d00-93c8-9a17cba9608f\",\n    \"configName\": \"账号自助-验证码开关\",\n    \"configKey\": \"sys.account.captchaEnabled\",\n    \"configValue\": \"false\",\n    \"configType\": \"Y\",\n    \"remark\": \"是否开启验证码功能（true开启，false关闭）\"\n  }\n}', '/api/system/config/update', '127.0.0.1', '内网IP', '2', '1', '2026-09-17 22:56:38', '7ed3cb8e-0ab3-4814-ad67-00518d819823', 21, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('5dc398ca-dba5-42e4-9e71-fe1d75d1e35c', '操作日志', 'admin', 'LogController.clearOperinfo', 'DELETE', '{\n  \"query\": {}\n}', '/api/monitor/log/operlog/clear', '127.0.0.1', '内网IP', '4', '1', '2026-09-16 22:53:55', 'ef07f965-b3f0-4925-b870-1e029ef43c8c', 68, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('65795965-aae4-4018-9d81-03ccff71fbcd', '菜单管理', 'admin', 'MenuController.update', 'PUT', '{\n  \"query\": {},\n  \"body\": {\n    \"createTime\": \"2026-09-13 11:10:05\",\n    \"updateTime\": \"2026-09-13 12:50:43\",\n    \"deleteTime\": null,\n    \"createBy\": \"admin\",\n    \"updateBy\": \"admin\",\n    \"id\": \"ce940b28-31f7-45f2-b1ce-59af70c2dd58\",\n    \"parentId\": \"c0e187f4-9550-4d69-ac3b-f9f0b1db46f3\",\n    \"path\": \"file\",\n    \"component\": \"system/file/index\",\n    \"menuType\": \"C\",\n    \"icon\": \"FileManagement\",\n    \"menuName\": \"文件管理\",\n    \"visible\": \"1\",\n    \"permission\": null,\n    \"status\": \"1\",\n    \"menuSort\": 7,\n    \"isCache\": \"0\"\n  }\n}', '/api/system/menu/update', '127.0.0.1', '内网IP', '2', '1', '2026-09-17 22:45:29', '3cae0893-f40f-45d2-bd79-64672d0159cc', 59, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('7f382eb2-c9d6-4f69-ba74-74c51cd0fde7', '菜单管理', 'admin', 'MenuController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"menuType\": \"F\",\n    \"parentId\": \"149bc63f-a824-4bcc-b1b5-dd204671521e\",\n    \"menuSort\": 4,\n    \"status\": \"1\",\n    \"visible\": \"1\",\n    \"isCache\": \"0\",\n    \"menuName\": \"参数删除\",\n    \"permission\": \"system:config:delete\"\n  }\n}', '/api/system/menu/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:53:09', 'bb60d247-467c-44af-a625-aed37174f92c', 30, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('829b73a1-0392-47bf-806b-ed0a6d3b35ea', '菜单管理', 'admin', 'MenuController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"menuType\": \"F\",\n    \"parentId\": \"149bc63f-a824-4bcc-b1b5-dd204671521e\",\n    \"menuSort\": 2,\n    \"status\": \"1\",\n    \"visible\": \"1\",\n    \"isCache\": \"0\",\n    \"menuName\": \"参数新增\",\n    \"permission\": \"system:config:create\"\n  }\n}', '/api/system/menu/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:52:17', '34e818c2-465c-452c-8252-02f402e9f348', 29, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('94fca919-2c66-49ae-b2a1-ac684acc7315', '菜单管理', 'admin', 'MenuController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"menuType\": \"F\",\n    \"parentId\": \"149bc63f-a824-4bcc-b1b5-dd204671521e\",\n    \"menuSort\": 1,\n    \"status\": \"1\",\n    \"visible\": \"1\",\n    \"isCache\": \"0\",\n    \"permission\": \"system:config:query\",\n    \"menuName\": \"参数查询\"\n  }\n}', '/api/system/menu/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:52:04', '0d1140d8-fe3a-493e-b3e4-51f6508564c0', 29, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('99cbe935-ef32-4285-a62e-b0d2674f88e6', '参数管理', 'admin', 'ConfigController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"configType\": \"Y\",\n    \"configKey\": \"sys.account.captchaEnabled\",\n    \"configName\": \"账号自助-验证码开关\",\n    \"configValue\": \"true\",\n    \"remark\": \"是否开启验证码功能（true开启，false关闭）\"\n  }\n}', '/api/system/config/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 22:56:18', '5c7f2762-b390-437a-a4e8-13a72a49f319', 20, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('a6e24012-68dc-44cd-873f-d3aa24611878', '参数管理', 'admin', 'ConfigController.update', 'PUT', '{\n  \"query\": {},\n  \"body\": {\n    \"createTime\": \"2026-09-17 22:56:18\",\n    \"updateTime\": \"2026-09-17 22:56:38\",\n    \"deleteTime\": null,\n    \"createBy\": \"admin\",\n    \"updateBy\": \"admin\",\n    \"id\": \"076189e6-d54f-4d00-93c8-9a17cba9608f\",\n    \"configName\": \"是否开启登录验证码\",\n    \"configKey\": \"sys.account.captchaEnabled\",\n    \"configValue\": \"false\",\n    \"configType\": \"Y\",\n    \"remark\": \"是否开启验证码功能（true开启，false关闭）\"\n  }\n}', '/api/system/config/update', '127.0.0.1', '内网IP', '2', '1', '2026-09-17 23:28:38', 'd3ea1bf6-3fde-4f2e-a0d2-2bce6818a732', 45, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('aed3a1e8-0ef5-4a0c-b767-683ade50e276', '参数管理', 'admin', 'ConfigController.update', 'PUT', '{\n  \"query\": {},\n  \"body\": {\n    \"createTime\": \"2026-09-17 22:56:18\",\n    \"updateTime\": \"2026-09-17 23:28:55\",\n    \"deleteTime\": null,\n    \"createBy\": \"admin\",\n    \"updateBy\": \"admin\",\n    \"id\": \"076189e6-d54f-4d00-93c8-9a17cba9608f\",\n    \"configName\": \"账号自助-验证码开关\",\n    \"configKey\": \"sys.account.captchaEnabled\",\n    \"configValue\": \"true\",\n    \"configType\": \"Y\",\n    \"remark\": \"是否开启验证码功能（true开启，false关闭）\"\n  }\n}', '/api/system/config/update', '127.0.0.1', '内网IP', '2', '1', '2026-09-17 23:31:24', '9865b286-4d73-4ad1-b976-4dc7681acc28', 22, '866b0232-507b-42a4-bdc1-47fc4a83616a');
INSERT INTO `sys_oper_log` VALUES ('c15c2fce-673d-4ce1-bd3b-523fadadd2cf', '参数管理', 'admin', 'ConfigController.create', 'POST', '{\n  \"query\": {},\n  \"body\": {\n    \"configType\": \"Y\",\n    \"configName\": \"用户管理-账号初始密码\",\n    \"configKey\": \"sys.user.initPassword\",\n    \"configValue\": \"12345678\",\n    \"remark\": \"初始化密码 12345678\"\n  }\n}', '/api/system/config/create', '127.0.0.1', '内网IP', '1', '1', '2026-09-17 23:31:56', '38375eb7-533f-44b9-966c-5f0464818889', 31, '866b0232-507b-42a4-bdc1-47fc4a83616a');

-- ----------------------------
-- Table structure for sys_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_role`;
CREATE TABLE `sys_role`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_code` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色编码',
  `role_name` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色名称',
  `role_sort` int NOT NULL DEFAULT 1 COMMENT '角色排序',
  `data_scope` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '4' COMMENT '数据范围（1全部 2自定义 3本部门 4本部门及以下 5仅本人）',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_fd8cc60f0258a8d5948141d98e`(`role_code` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_role
-- ----------------------------
INSERT INTO `sys_role` VALUES ('2026-09-04 18:58:40', '2026-09-04 19:02:11', NULL, 'admin', 'admin', '0138f9e4-666c-4a0b-8c38-dba80e875774', 'admin', '系统管理员', 1, '1', '1', '最高权限');
INSERT INTO `sys_role` VALUES ('2026-09-12 14:17:29', '2026-09-13 14:44:22', NULL, 'admin', 'admin', '5e2db9ff-0913-4b92-91bc-ef329619842a', 'common', '普通角色', 2, '4', '1', '普通角色');

-- ----------------------------
-- Table structure for sys_role_dept
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_dept`;
CREATE TABLE `sys_role_dept`  (
  `role_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '角色ID',
  `dept_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '部门ID',
  PRIMARY KEY (`role_id`, `dept_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_role_dept
-- ----------------------------

-- ----------------------------
-- Table structure for sys_role_menu
-- ----------------------------
DROP TABLE IF EXISTS `sys_role_menu`;
CREATE TABLE `sys_role_menu`  (
  `role_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `menu_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`role_id`, `menu_id`) USING BTREE,
  INDEX `IDX_b65fa84413c357d7282153b4a8`(`role_id` ASC) USING BTREE,
  INDEX `IDX_543ffcaa38d767909d9022f252`(`menu_id` ASC) USING BTREE,
  CONSTRAINT `FK_543ffcaa38d767909d9022f2522` FOREIGN KEY (`menu_id`) REFERENCES `sys_menu` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_b65fa84413c357d7282153b4a88` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_role_menu
-- ----------------------------

-- ----------------------------
-- Table structure for sys_user
-- ----------------------------
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user`  (
  `create_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `update_time` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `create_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '创建人',
  `update_by` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '更新人',
  `id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '用户账号',
  `password` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '密码',
  `phone` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '手机号',
  `nickname` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '昵称',
  `email` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '邮箱',
  `status` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '1' COMMENT '状态',
  `gender` char(1) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '2' COMMENT '性别',
  `age` int NULL DEFAULT NULL COMMENT '年龄',
  `remark` varchar(200) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '备注',
  `login_time` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '最后登录时间',
  `delete_time` datetime NULL DEFAULT NULL COMMENT '删除时间',
  `dept_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '0' COMMENT '主部门ID（0 表示未分配）',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NULL DEFAULT NULL COMMENT '用户头像',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `IDX_9e7164b2f1ea1348bc0eb0a7da`(`username` ASC) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_user
-- ----------------------------
INSERT INTO `sys_user` VALUES ('2026-09-12 13:26:23', '2026-09-12 13:27:00', 'admin', 'admin', '13cd4e88-0ef4-4a8d-9a26-69fa62faf744', 'test', '$argon2id$v=19$m=65536,p=4,t=3$ggPJloEbge6hlfK3ecKusA$kfKp/5uPfkxHCpqUGYuU/eY7dt5GgD/KduJylD1dTqg', '18888888881', '测试人员', '18888888881@163.com', '1', '2', 18, '11', NULL, '2026-09-12 13:27:00', 'bb93a81a-039e-4cc3-a90d-9dce0857dde1', NULL);
INSERT INTO `sys_user` VALUES ('2026-08-29 22:01:32', '2026-09-17 23:29:05', 'admin', 'admin', '866b0232-507b-42a4-bdc1-47fc4a83616a', 'admin', '$argon2id$v=19$m=65536,p=4,t=3$9TpqdrZbWIjXxG3RWFla0w$VA9fL3QvLvB6yQxTzic9or9lbKAtq+IMm0CC8X6JhaQ', '16688889999', '天道', 'yunhe@163.com', '1', '1', 18, NULL, '2026-09-17 23:29:05', NULL, 'bb93a81a-039e-4cc3-a90d-9dce0857dde1', '');

-- ----------------------------
-- Table structure for sys_user_role
-- ----------------------------
DROP TABLE IF EXISTS `sys_user_role`;
CREATE TABLE `sys_user_role`  (
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `role_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`user_id`, `role_id`) USING BTREE,
  INDEX `IDX_71b4edf9aedbd3e5707156e80a`(`user_id` ASC) USING BTREE,
  INDEX `IDX_e8300bfcf561ed417f5f02c677`(`role_id` ASC) USING BTREE,
  CONSTRAINT `FK_71b4edf9aedbd3e5707156e80a2` FOREIGN KEY (`user_id`) REFERENCES `sys_user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FK_e8300bfcf561ed417f5f02c6776` FOREIGN KEY (`role_id`) REFERENCES `sys_role` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_unicode_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Records of sys_user_role
-- ----------------------------
INSERT INTO `sys_user_role` VALUES ('866b0232-507b-42a4-bdc1-47fc4a83616a', '0138f9e4-666c-4a0b-8c38-dba80e875774');

SET FOREIGN_KEY_CHECKS = 1;
