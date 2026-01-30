-- 年会抽奖系统 - 数据库初始化脚本
-- 适用于 MySQL 8.0+
-- 创建时间：2026-01-30

-- ============================================
-- 1. 创建数据库
-- ============================================

CREATE DATABASE IF NOT EXISTS annual_lottery 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE annual_lottery;

-- ============================================
-- 2. 创建用户并授权（可选）
-- ============================================

-- 创建专用数据库用户
-- CREATE USER IF NOT EXISTS 'lottery_user'@'%' IDENTIFIED BY 'your_secure_password_here';

-- 授予权限
-- GRANT ALL PRIVILEGES ON annual_lottery.* TO 'lottery_user'@'%';
-- FLUSH PRIVILEGES;

-- ============================================
-- 3. 创建表结构
-- ============================================

-- 奖品表
CREATE TABLE IF NOT EXISTS prizes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '奖品名称',
    total_count INT NOT NULL DEFAULT 0 COMMENT '总数量',
    remaining_count INT NOT NULL DEFAULT 0 COMMENT '剩余数量',
    image_url TEXT COMMENT '奖品图片URL',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='奖品表';

-- 参与者表
CREATE TABLE IF NOT EXISTS participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL COMMENT '参与者姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_name (name),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='参与者表';

-- 中奖记录表
CREATE TABLE IF NOT EXISTS winners (
    id INT AUTO_INCREMENT PRIMARY KEY,
    prize_id INT NOT NULL COMMENT '奖品ID',
    prize_name VARCHAR(255) NOT NULL COMMENT '奖品名称',
    participant_id INT NOT NULL COMMENT '参与者ID',
    participant_name VARCHAR(255) NOT NULL COMMENT '参与者姓名',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '中奖时间',
    INDEX idx_prize_id (prize_id),
    INDEX idx_participant_id (participant_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='中奖记录表';

-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    open_id VARCHAR(255) NOT NULL COMMENT 'OAuth ID',
    name VARCHAR(255) NOT NULL COMMENT '用户名',
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user' COMMENT '角色',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY uk_open_id (open_id),
    INDEX idx_role (role),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 4. 插入示例数据（可选）
-- ============================================

-- 插入示例奖品
INSERT INTO prizes (name, total_count, remaining_count, image_url) VALUES
('一等奖 - iPhone 15 Pro', 1, 1, NULL),
('二等奖 - iPad Air', 3, 3, NULL),
('三等奖 - AirPods Pro', 5, 5, NULL),
('参与奖 - 红包', 20, 20, NULL);

-- 插入示例参与者
INSERT INTO participants (name) VALUES
('张三'), ('李四'), ('王五'), ('赵六'), ('钱七'),
('孙八'), ('周九'), ('吴十'), ('郑十一'), ('王十二'),
('冯十三'), ('陈十四'), ('楚十五'), ('卫十六'), ('蒋十七'),
('沈十八'), ('韩十九'), ('杨二十'), ('朱二十一'), ('秦二十二'),
('尤二十三'), ('许二十四'), ('何二十五'), ('吕二十六'), ('施二十七'),
('张二十八'), ('孔二十九'), ('曹三十');

-- 插入默认管理员用户
INSERT INTO user (open_id, name, role) VALUES
('admin', '管理员', 'admin');

-- ============================================
-- 5. 创建视图（可选）
-- ============================================

-- 中奖统计视图
CREATE OR REPLACE VIEW v_winner_statistics AS
SELECT 
    p.id AS prize_id,
    p.name AS prize_name,
    p.total_count,
    p.remaining_count,
    COUNT(w.id) AS winner_count,
    GROUP_CONCAT(w.participant_name ORDER BY w.created_at SEPARATOR ', ') AS winners
FROM prizes p
LEFT JOIN winners w ON p.id = w.prize_id
GROUP BY p.id, p.name, p.total_count, p.remaining_count;

-- 参与者中奖情况视图
CREATE OR REPLACE VIEW v_participant_prizes AS
SELECT 
    pt.id AS participant_id,
    pt.name AS participant_name,
    COUNT(w.id) AS prize_count,
    GROUP_CONCAT(w.prize_name ORDER BY w.created_at SEPARATOR ', ') AS prizes
FROM participants pt
LEFT JOIN winners w ON pt.id = w.participant_id
GROUP BY pt.id, pt.name;

-- ============================================
-- 6. 创建存储过程（可选）
-- ============================================

DELIMITER //

-- 重置所有奖品数量
CREATE PROCEDURE IF NOT EXISTS sp_reset_prize_counts()
BEGIN
    UPDATE prizes SET remaining_count = total_count;
    SELECT '所有奖品数量已重置' AS message;
END //

-- 清空所有中奖记录
CREATE PROCEDURE IF NOT EXISTS sp_clear_all_winners()
BEGIN
    DELETE FROM winners;
    CALL sp_reset_prize_counts();
    SELECT '所有中奖记录已清空，奖品数量已重置' AS message;
END //

-- 获取中奖统计
CREATE PROCEDURE IF NOT EXISTS sp_get_winner_statistics()
BEGIN
    SELECT * FROM v_winner_statistics;
END //

DELIMITER ;

-- ============================================
-- 7. 数据库完整性检查
-- ============================================

-- 检查表是否创建成功
SELECT 
    TABLE_NAME,
    TABLE_ROWS,
    CREATE_TIME,
    TABLE_COMMENT
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'annual_lottery'
ORDER BY TABLE_NAME;

-- ============================================
-- 8. 备份和恢复说明
-- ============================================

-- 备份数据库：
-- mysqldump -u root -p annual_lottery > backup_$(date +%Y%m%d_%H%M%S).sql

-- 恢复数据库：
-- mysql -u root -p annual_lottery < backup_20260130_120000.sql

-- ============================================
-- 初始化完成
-- ============================================

SELECT '数据库初始化完成！' AS status;
SELECT CONCAT('数据库: annual_lottery') AS info;
SELECT CONCAT('表数量: ', COUNT(*)) AS table_count 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = 'annual_lottery';
