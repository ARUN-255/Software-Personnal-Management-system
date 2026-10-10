package com.spms.service;

import com.spms.entity.*;
import com.spms.repository.*;
import java.io.ByteArrayOutputStream;
import java.time.*;
import java.math.BigDecimal;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.*;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

@Service @RequiredArgsConstructor
public class ReportService {
    private final AttendanceRepository attendance;
    private final PayrollRepository payroll;
    private final EmployeeRepository employees;
    private final EmployeeDocumentRepository documents;

    public Map<String, Object> summary(YearMonth month, UUID employeeId) {
        var rows = attendance.findAll().stream()
                .filter(r -> YearMonth.from(r.getWorkDate()).equals(month))
                .filter(r -> employeeId == null || r.getEmployee().getId().equals(employeeId)).toList();
        Map<String, Long> counts = new LinkedHashMap<>();
        for (var status : AttendanceRecord.Status.values())
            counts.put(status.name(), rows.stream().filter(r -> r.getStatus() == status).count());
        long minutes = rows.stream().filter(r -> r.getCheckedInAt() != null && r.getCheckedOutAt() != null)
                .mapToLong(r -> Duration.between(r.getCheckedInAt(), r.getCheckedOutAt()).toMinutes()).sum();
        var pays = payroll.findAll().stream()
                .filter(p -> YearMonth.from(p.getPayPeriod()).equals(month))
                .filter(p -> p.getStatus() == PayrollRecord.Status.PUBLISHED)
                .filter(p -> employeeId == null || p.getEmployee().getId().equals(employeeId)).toList();
        var net = pays.stream().map(PayrollRecord::getNetPay).reduce(BigDecimal.ZERO, BigDecimal::add);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("month", month.toString());
        result.put("attendance", counts);
        result.put("workedMinutes", minutes);
        result.put("publishedNetPay", net);
        result.put("payslipCount", pays.size());
        result.put("recordCount", rows.size());
        if (employeeId == null) {
            var all = employees.findAll();
            var certificateOwners = new HashSet<UUID>();
            documents.findAll().stream().filter(d -> d.getDocumentType() == EmployeeDocument.Type.CERTIFICATE)
                    .forEach(d -> certificateOwners.add(d.getEmployee().getId()));
            result.put("employeeCount", all.size());
            result.put("missingCertificates", all.stream().filter(e -> !certificateOwners.contains(e.getId()))
                    .map(e -> Map.of("id", e.getId(), "name", e.getFullName(), "code", e.getEmployeeCode())).toList());
        }
        return result;
    }

    public String csv(YearMonth month) {
        var csv = new StringBuilder("Employee code,Name,Date,Status,Check in,Check out,Minutes\r\n");
        attendance.findAll().stream().filter(r -> YearMonth.from(r.getWorkDate()).equals(month))
                .sorted(Comparator.comparing(AttendanceRecord::getWorkDate)).forEach(r -> {
                    long minutes = r.getCheckedInAt() != null && r.getCheckedOutAt() != null
                            ? Duration.between(r.getCheckedInAt(), r.getCheckedOutAt()).toMinutes() : 0;
                    csv.append(String.join(",", cell(r.getEmployee().getEmployeeCode()), cell(r.getEmployee().getFullName()),
                            cell(r.getWorkDate()), cell(r.getStatus()), cell(r.getCheckedInAt()), cell(r.getCheckedOutAt()), cell(minutes)))
                            .append("\r\n");
                });
        return csv.toString();
    }

    public byte[] xlsx(YearMonth month) throws Exception {
        try (var workbook = new org.apache.poi.xssf.usermodel.XSSFWorkbook();
             var output = new ByteArrayOutputStream()) {
            var sheet = workbook.createSheet("Attendance " + month);
            String[] headings = {"Employee code", "Name", "Date", "Status", "Check in", "Check out", "Minutes"};
            var header = sheet.createRow(0);
            var style = workbook.createCellStyle();
            var font = workbook.createFont(); font.setBold(true); style.setFont(font);
            for (int index = 0; index < headings.length; index++) { header.createCell(index).setCellValue(headings[index]); header.getCell(index).setCellStyle(style); }
            var rows = attendance.findAll().stream().filter(record -> YearMonth.from(record.getWorkDate()).equals(month))
                    .sorted(Comparator.comparing(AttendanceRecord::getWorkDate)).toList();
            for (int index = 0; index < rows.size(); index++) {
                var record = rows.get(index); var row = sheet.createRow(index + 1);
                long minutes = record.getCheckedInAt() != null && record.getCheckedOutAt() != null ? Duration.between(record.getCheckedInAt(), record.getCheckedOutAt()).toMinutes() : 0;
                row.createCell(0).setCellValue(record.getEmployee().getEmployeeCode());
                row.createCell(1).setCellValue(record.getEmployee().getFullName());
                row.createCell(2).setCellValue(record.getWorkDate().toString());
                row.createCell(3).setCellValue(record.getStatus().name());
                row.createCell(4).setCellValue(record.getCheckedInAt() == null ? "" : record.getCheckedInAt().toString());
                row.createCell(5).setCellValue(record.getCheckedOutAt() == null ? "" : record.getCheckedOutAt().toString());
                row.createCell(6).setCellValue(minutes);
            }
            for (int index = 0; index < headings.length; index++) sheet.autoSizeColumn(index);
            workbook.write(output); return output.toByteArray();
        }
    }

    static String cell(Object value) {
        String text = value == null ? "" : value.toString();
        if (text.stripLeading().matches("^[=+@\\-].*")) text = "'" + text;
        return "\"" + text.replace("\"", "\"\"") + "\"";
    }

    public byte[] payslip(PayrollRecord record) throws Exception {
        try (var pdf = new PDDocument(); var output = new ByteArrayOutputStream()) {
            var page = new PDPage();
            pdf.addPage(page);
            try (var text = new PDPageContentStream(pdf, page)) {
                text.beginText();
                text.setFont(PDType1Font.HELVETICA, 12);
                text.setLeading(28);
                text.newLineAtOffset(55, 740);
                for (String line : List.of("Bronzera Labs - Payslip", "Period: " + YearMonth.from(record.getPayPeriod()),
                        "Employee: " + record.getEmployee().getFullName(), "Code: " + record.getEmployee().getEmployeeCode(),
                        "Basic pay (INR): " + record.getBasicPay(), "Allowances (INR): " + record.getAllowances(),
                        "Deductions (INR): " + record.getDeductions(), "Net pay (INR): " + record.getNetPay(),
                        "Published: " + record.getPublishedAt(), "Generated from the published payroll record.")) {
                    text.showText(line.replaceAll("[^\\x20-\\x7E]", "?"));
                    text.newLine();
                }
                text.endText();
            }
            pdf.save(output);
            return output.toByteArray();
        }
    }
}
