-- Company ownership foundation. Apply after migrations 001-009.
-- Nullable so existing companies and administrator-created companies remain valid.
ALTER TABLE `companies`
  ADD COLUMN `created_by` int DEFAULT NULL AFTER `id`,
  ADD KEY `companies_created_by_index` (`created_by`),
  ADD CONSTRAINT `companies_created_by_fk`
    FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
    ON DELETE SET NULL ON UPDATE CASCADE;
