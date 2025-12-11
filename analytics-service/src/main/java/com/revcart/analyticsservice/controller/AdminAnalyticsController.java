package com.revcart.analyticsservice.controller;

import com.revcart.analyticsservice.dto.ApiResponse;
import com.revcart.analyticsservice.dto.DashboardDto;
import com.revcart.analyticsservice.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminAnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<DashboardDto>> getDashboardStats() {
        DashboardDto dashboard = analyticsService.computeDashboardData();
        return ResponseEntity.ok(ApiResponse.success(dashboard));
    }
}