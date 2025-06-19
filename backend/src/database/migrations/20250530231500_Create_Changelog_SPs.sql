-- Migración: Crear Stored Procedures para Changelog
-- Fecha: 2025-05-30

:r ..\stored_procedures\sp_Changelog_Create.sql
:r ..\stored_procedures\sp_Changelog_Get.sql
:r ..\stored_procedures\sp_Changelog_GetAll.sql
:r ..\stored_procedures\sp_Changelog_GetPublic.sql
:r ..\stored_procedures\sp_Changelog_Update.sql
:r ..\stored_procedures\sp_Changelog_Delete.sql

PRINT 'Stored Procedures de Changelog creados correctamente';